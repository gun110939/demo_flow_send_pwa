const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Load employees data
const employeesPath = path.join(__dirname, 'data', 'employees.json');
const employees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));

// Create lookup map for quick access
const employeeMap = new Map();
employees.forEach(emp => employeeMap.set(emp.PERNR, emp));

// In-memory storage for work results and evaluations
let workResults = [];
let evaluationHistory = [];
let committeeMembers = [];

// Initialize with some sample data
initializeSampleData();

function initializeSampleData() {
  // Random select committee members
  // Pre-final committee: random from level 9-10 (one per PARENTORG)
  // Final committee: random from level 10-11

  const level9to10 = employees.filter(e => e.PERSK >= 9 && e.PERSK <= 10);
  const level10to11 = employees.filter(e => e.PERSK >= 10 && e.PERSK <= 11);

  // Get unique PARENTORGs
  const parentOrgs = [...new Set(employees.map(e => e.PARENTORG).filter(p => p))];

  // Assign pre-final committee (one per PARENTORG)
  parentOrgs.forEach(org => {
    const candidates = level9to10.filter(e => e.PARENTORG === org);
    if (candidates.length > 0) {
      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      committeeMembers.push({
        id: uuidv4(),
        employeePernr: selected.PERNR,
        committeeStage: 'PRE_FINAL',
        parentorgFilter: org
      });
    }
  });

  // Assign final committee (5 random from level 10-11)
  const shuffled = level10to11.sort(() => 0.5 - Math.random());
  shuffled.slice(0, 5).forEach(emp => {
    committeeMembers.push({
      id: uuidv4(),
      employeePernr: emp.PERNR,
      committeeStage: 'FINAL',
      parentorgFilter: null // Can see all
    });
  });

  // Create sample work results
  createSampleWorkResults();
}

function createSampleWorkResults() {
  // Select 10 random employees to have sample work results
  const sampleEmployees = employees
    .filter(e => e.PERSK <= 8) // Regular employees
    .sort(() => 0.5 - Math.random())
    .slice(0, 10);

  const workTitles = [
    'พัฒนาระบบติดตามการใช้น้ำ',
    'ปรับปรุงกระบวนการผลิตน้ำประปา',
    'โครงการลดน้ำสูญเสีย',
    'พัฒนาแอปพลิเคชันแจ้งปัญหา',
    'ปรับปรุงระบบบริการลูกค้า',
    'โครงการประหยัดพลังงาน',
    'พัฒนาระบบตรวจสอบคุณภาพน้ำ',
    'ปรับปรุงระบบจัดเก็บรายได้',
    'โครงการบำรุงรักษาเชิงป้องกัน',
    'พัฒนาระบบรายงานผล'
  ];

  sampleEmployees.forEach((emp, index) => {
    const workResult = {
      id: uuidv4(),
      employeePernr: emp.PERNR,
      title: workTitles[index],
      description: `รายละเอียดผลงาน: ${workTitles[index]} โดย ${emp.ENAME}`,
      status: 'PENDING',
      currentEvaluatorPernr: emp.MGRPERNR,
      evaluationCount: 0,
      committeeStage: 'NONE',
      score: null,
      submittedAt: new Date().toISOString(),
      completedAt: null
    };
    workResults.push(workResult);
  });
}

// Helper function to get chain of command
function getChainOfCommand(pernr) {
  const chain = [];
  let current = employeeMap.get(pernr);
  const visited = new Set();

  while (current && !visited.has(current.PERNR)) {
    chain.push(current);
    visited.add(current.PERNR);

    if (!current.MGRPERNR) break;
    current = employeeMap.get(current.MGRPERNR);
  }

  return chain;
}

// Helper function to determine next evaluator
function getNextEvaluator(workResult) {
  const employee = employeeMap.get(workResult.employeePernr);

  // Rule 4: No PARENTORG -> send to pre-final committee
  if (!employee.PARENTORG) {
    return { stage: 'PRE_FINAL', evaluator: null };
  }

  // Get current evaluator
  const currentEvaluator = employeeMap.get(workResult.currentEvaluatorPernr);
  if (!currentEvaluator) {
    return { stage: 'PRE_FINAL', evaluator: null };
  }

  // Get next manager
  const nextMgr = employeeMap.get(currentEvaluator.MGRPERNR);

  // Rule 4: No next manager -> send to pre-final committee
  if (!nextMgr) {
    return { stage: 'PRE_FINAL', evaluator: null };
  }

  // Check if next manager is level 10 or above
  if (nextMgr.PERSK >= 10) {
    // Rule 2: Already evaluated >= 2 times -> skip to pre-final
    if (workResult.evaluationCount >= 2) {
      return { stage: 'PRE_FINAL', evaluator: null };
    }
    // Rule 3: Not enough evaluations -> force evaluation at level 10/11
    return { stage: 'NORMAL', evaluator: nextMgr };
  }

  // Rule 1: Normal flow
  return { stage: 'NORMAL', evaluator: nextMgr };
}

// ================== API ROUTES ==================

// Get all employees (with pagination and search)
app.get('/api/employees', (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  let filtered = employees;

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = employees.filter(e =>
      e.ENAME.toLowerCase().includes(searchLower) ||
      String(e.PERNR).includes(search)
    );
  }

  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));

  res.json({
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit),
    data: paginated
  });
});

// Get employee by PERNR
app.get('/api/employees/:pernr', (req, res) => {
  const pernr = parseInt(req.params.pernr);
  const employee = employeeMap.get(pernr);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  res.json(employee);
});

// Get chain of command for employee
app.get('/api/employees/:pernr/chain', (req, res) => {
  const pernr = parseInt(req.params.pernr);
  const chain = getChainOfCommand(pernr);
  res.json(chain);
});

// Get employees for login selection (grouped by role)
app.get('/api/employees/login/options', (req, res) => {
  // Get sample employees for each role type
  const regularEmployees = employees
    .filter(e => e.PERSK <= 7)
    .sort(() => 0.5 - Math.random())
    .slice(0, 10);

  const managers = employees
    .filter(e => e.PERSK >= 8 && e.PERSK <= 9)
    .sort(() => 0.5 - Math.random())
    .slice(0, 10);

  const executives = employees
    .filter(e => e.PERSK >= 10)
    .sort(() => 0.5 - Math.random())
    .slice(0, 5);

  // Get committee members
  const preFinalCommittee = committeeMembers
    .filter(c => c.committeeStage === 'PRE_FINAL')
    .slice(0, 5)
    .map(c => ({
      ...employeeMap.get(c.employeePernr),
      committeeRole: 'PRE_FINAL'
    }));

  const finalCommittee = committeeMembers
    .filter(c => c.committeeStage === 'FINAL')
    .map(c => ({
      ...employeeMap.get(c.employeePernr),
      committeeRole: 'FINAL'
    }));

  res.json({
    regularEmployees,
    managers,
    executives,
    preFinalCommittee,
    finalCommittee
  });
});

// Get all work results
app.get('/api/work-results', (req, res) => {
  const { status, employeePernr, evaluatorPernr } = req.query;
  let filtered = workResults;

  if (status) {
    filtered = filtered.filter(w => w.status === status);
  }

  if (employeePernr) {
    filtered = filtered.filter(w => w.employeePernr === parseInt(employeePernr));
  }

  if (evaluatorPernr) {
    filtered = filtered.filter(w => w.currentEvaluatorPernr === parseInt(evaluatorPernr));
  }

  // Enrich with employee data
  const enriched = filtered.map(w => ({
    ...w,
    employee: employeeMap.get(w.employeePernr),
    currentEvaluator: w.currentEvaluatorPernr ? employeeMap.get(w.currentEvaluatorPernr) : null
  }));

  res.json(enriched);
});

// Get work results pending for evaluation (with visibility rules)
app.get('/api/work-results/pending/:evaluatorPernr', (req, res) => {
  const evaluatorPernr = parseInt(req.params.evaluatorPernr);
  const evaluator = employeeMap.get(evaluatorPernr);

  if (!evaluator) {
    return res.status(404).json({ error: 'Evaluator not found' });
  }

  // Check if evaluator is committee member
  const committee = committeeMembers.find(c => c.employeePernr === evaluatorPernr);

  let filtered;

  if (committee && committee.committeeStage === 'FINAL') {
    // Final committee can see all work results in FINAL stage
    filtered = workResults.filter(w => w.committeeStage === 'FINAL');
  } else if (committee && committee.committeeStage === 'PRE_FINAL') {
    // Pre-final committee can see work results in PRE_FINAL stage from their PARENTORG
    filtered = workResults.filter(w => {
      if (w.committeeStage !== 'PRE_FINAL') return false;
      const emp = employeeMap.get(w.employeePernr);
      return emp && emp.PARENTORG === committee.parentorgFilter;
    });
  } else {
    // Regular evaluator can only see work results assigned to them
    filtered = workResults.filter(w =>
      w.currentEvaluatorPernr === evaluatorPernr &&
      w.status === 'PENDING' &&
      w.committeeStage === 'NONE'
    );
  }

  // Enrich with employee data
  const enriched = filtered.map(w => ({
    ...w,
    employee: employeeMap.get(w.employeePernr),
    currentEvaluator: w.currentEvaluatorPernr ? employeeMap.get(w.currentEvaluatorPernr) : null,
    evaluations: evaluationHistory.filter(e => e.workResultId === w.id)
  }));

  res.json(enriched);
});

// Create new work result
app.post('/api/work-results', (req, res) => {
  const { employeePernr, title, description } = req.body;
  const employee = employeeMap.get(parseInt(employeePernr));

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const workResult = {
    id: uuidv4(),
    employeePernr: parseInt(employeePernr),
    title,
    description,
    status: 'PENDING',
    currentEvaluatorPernr: employee.MGRPERNR,
    evaluationCount: 0,
    committeeStage: 'NONE',
    score: null,
    submittedAt: new Date().toISOString(),
    completedAt: null
  };

  // Special case: no PARENTORG or no MGRPERNR
  if (!employee.PARENTORG || !employee.MGRPERNR) {
    workResult.committeeStage = 'PRE_FINAL';
    workResult.currentEvaluatorPernr = null;
  }

  workResults.push(workResult);

  res.json({
    ...workResult,
    employee,
    nextEvaluator: workResult.currentEvaluatorPernr ? employeeMap.get(workResult.currentEvaluatorPernr) : null
  });
});

// Get work result by ID
app.get('/api/work-results/:id', (req, res) => {
  const workResult = workResults.find(w => w.id === req.params.id);

  if (!workResult) {
    return res.status(404).json({ error: 'Work result not found' });
  }

  const enriched = {
    ...workResult,
    employee: employeeMap.get(workResult.employeePernr),
    currentEvaluator: workResult.currentEvaluatorPernr ? employeeMap.get(workResult.currentEvaluatorPernr) : null,
    evaluations: evaluationHistory
      .filter(e => e.workResultId === workResult.id)
      .map(e => ({
        ...e,
        evaluator: employeeMap.get(e.evaluatorPernr)
      }))
      .sort((a, b) => a.evaluationOrder - b.evaluationOrder)
  };

  res.json(enriched);
});

// Evaluate work result
app.post('/api/work-results/:id/evaluate', (req, res) => {
  const workResult = workResults.find(w => w.id === req.params.id);

  if (!workResult) {
    return res.status(404).json({ error: 'Work result not found' });
  }

  const { evaluatorPernr, status, comments, score } = req.body;
  const evaluator = employeeMap.get(parseInt(evaluatorPernr));

  if (!evaluator) {
    return res.status(404).json({ error: 'Evaluator not found' });
  }

  // Create evaluation record
  const evaluation = {
    id: uuidv4(),
    workResultId: workResult.id,
    evaluatorPernr: parseInt(evaluatorPernr),
    evaluatorLevel: evaluator.PERSK,
    evaluationOrder: workResult.evaluationCount + 1,
    status,
    comments: comments || '',
    score: score || null,
    evaluatedAt: new Date().toISOString()
  };

  evaluationHistory.push(evaluation);
  workResult.evaluationCount++;

  if (status === 'REJECTED') {
    workResult.status = 'REJECTED';
    workResult.completedAt = new Date().toISOString();
    return res.json({
      workResult: {
        ...workResult,
        employee: employeeMap.get(workResult.employeePernr)
      },
      evaluation,
      nextAction: 'REJECTED'
    });
  }

  // Determine next step
  if (workResult.committeeStage === 'FINAL') {
    // Final approval
    workResult.status = 'APPROVED';
    workResult.completedAt = new Date().toISOString();
    return res.json({
      workResult: {
        ...workResult,
        employee: employeeMap.get(workResult.employeePernr)
      },
      evaluation,
      nextAction: 'COMPLETED'
    });
  }

  if (workResult.committeeStage === 'PRE_FINAL') {
    // Move to final committee
    workResult.committeeStage = 'FINAL';
    workResult.score = score;
    workResult.currentEvaluatorPernr = null;
    return res.json({
      workResult: {
        ...workResult,
        employee: employeeMap.get(workResult.employeePernr)
      },
      evaluation,
      nextAction: 'SENT_TO_FINAL'
    });
  }

  // Normal flow - determine next evaluator
  const nextStep = getNextEvaluator(workResult);

  if (nextStep.stage === 'PRE_FINAL') {
    workResult.committeeStage = 'PRE_FINAL';
    workResult.currentEvaluatorPernr = null;
    return res.json({
      workResult: {
        ...workResult,
        employee: employeeMap.get(workResult.employeePernr)
      },
      evaluation,
      nextAction: 'SENT_TO_PRE_FINAL'
    });
  }

  // Send to next manager
  workResult.currentEvaluatorPernr = nextStep.evaluator.PERNR;

  res.json({
    workResult: {
      ...workResult,
      employee: employeeMap.get(workResult.employeePernr)
    },
    evaluation,
    nextAction: 'SENT_TO_NEXT',
    nextEvaluator: nextStep.evaluator
  });
});

// Get evaluation history for work result
app.get('/api/work-results/:id/evaluations', (req, res) => {
  const evaluations = evaluationHistory
    .filter(e => e.workResultId === req.params.id)
    .map(e => ({
      ...e,
      evaluator: employeeMap.get(e.evaluatorPernr)
    }))
    .sort((a, b) => a.evaluationOrder - b.evaluationOrder);

  res.json(evaluations);
});

// Get committee members
app.get('/api/committee', (req, res) => {
  const { stage } = req.query;
  let filtered = committeeMembers;

  if (stage) {
    filtered = filtered.filter(c => c.committeeStage === stage);
  }

  const enriched = filtered.map(c => ({
    ...c,
    employee: employeeMap.get(c.employeePernr)
  }));

  res.json(enriched);
});

// Add committee member
app.post('/api/committee', (req, res) => {
  const { employeePernr, committeeStage, parentorgFilter } = req.body;
  const employee = employeeMap.get(parseInt(employeePernr));

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  // Check if already a committee member in this stage
  const existing = committeeMembers.find(c =>
    c.employeePernr === parseInt(employeePernr) &&
    c.committeeStage === committeeStage
  );

  if (existing) {
    return res.status(400).json({ error: 'Already a committee member in this stage' });
  }

  const newMember = {
    id: uuidv4(),
    employeePernr: parseInt(employeePernr),
    committeeStage,
    parentorgFilter: committeeStage === 'PRE_FINAL' ? (parentorgFilter || employee.PARENTORG) : null
  };

  committeeMembers.push(newMember);

  res.json({
    ...newMember,
    employee
  });
});

// Remove committee member
app.delete('/api/committee/:id', (req, res) => {
  const index = committeeMembers.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Committee member not found' });
  }

  committeeMembers.splice(index, 1);
  res.json({ message: 'Committee member removed' });
});

// Get suggested employees for committee (by PARENTORG)
app.get('/api/committee/suggestions/:parentorg', (req, res) => {
  const parentorg = decodeURIComponent(req.params.parentorg);

  // Get employees from same PARENTORG with level 8-11
  const suggestions = employees
    .filter(e => e.PARENTORG === parentorg && e.PERSK >= 8 && e.PERSK <= 11)
    .map(e => ({
      ...e,
      isAlreadyCommittee: committeeMembers.some(c => c.employeePernr === e.PERNR)
    }))
    .sort((a, b) => b.PERSK - a.PERSK); // Sort by level descending

  res.json(suggestions);
});

// Check if PARENTORG has pre-final committee
app.get('/api/committee/check/:parentorg', (req, res) => {
  const parentorg = decodeURIComponent(req.params.parentorg);

  const hasCommittee = committeeMembers.some(c =>
    c.committeeStage === 'PRE_FINAL' &&
    c.parentorgFilter === parentorg
  );

  const committee = committeeMembers.find(c =>
    c.committeeStage === 'PRE_FINAL' &&
    c.parentorgFilter === parentorg
  );

  res.json({
    hasCommittee,
    committee: committee ? {
      ...committee,
      employee: employeeMap.get(committee.employeePernr)
    } : null
  });
});

// Get all unique PARENTORGs with their committee status
app.get('/api/committee/coverage', (req, res) => {
  const parentOrgs = [...new Set(employees.map(e => e.PARENTORG).filter(p => p))];

  const coverage = parentOrgs.map(org => {
    const committee = committeeMembers.find(c =>
      c.committeeStage === 'PRE_FINAL' &&
      c.parentorgFilter === org
    );

    return {
      parentorg: org,
      hasCommittee: !!committee,
      committee: committee ? {
        ...committee,
        employee: employeeMap.get(committee.employeePernr)
      } : null,
      employeeCount: employees.filter(e => e.PARENTORG === org).length
    };
  }).sort((a, b) => a.parentorg.localeCompare(b.parentorg));

  res.json(coverage);
});

// Get dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const stats = {
    totalEmployees: employees.length,
    totalWorkResults: workResults.length,
    pending: workResults.filter(w => w.status === 'PENDING').length,
    approved: workResults.filter(w => w.status === 'APPROVED').length,
    rejected: workResults.filter(w => w.status === 'REJECTED').length,
    inPreFinal: workResults.filter(w => w.committeeStage === 'PRE_FINAL').length,
    inFinal: workResults.filter(w => w.committeeStage === 'FINAL').length,
    totalEvaluations: evaluationHistory.length
  };

  res.json(stats);
});

// Get stats for specific user
app.get('/api/dashboard/stats/:pernr', (req, res) => {
  const pernr = parseInt(req.params.pernr);
  const employee = employeeMap.get(pernr);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  // Check if committee member
  const committee = committeeMembers.find(c => c.employeePernr === pernr);

  let pendingCount = 0;
  let myWorkResults = workResults.filter(w => w.employeePernr === pernr);

  if (committee && committee.committeeStage === 'FINAL') {
    pendingCount = workResults.filter(w => w.committeeStage === 'FINAL').length;
  } else if (committee && committee.committeeStage === 'PRE_FINAL') {
    pendingCount = workResults.filter(w => {
      if (w.committeeStage !== 'PRE_FINAL') return false;
      const emp = employeeMap.get(w.employeePernr);
      return emp && emp.PARENTORG === committee.parentorgFilter;
    }).length;
  } else {
    pendingCount = workResults.filter(w =>
      w.currentEvaluatorPernr === pernr &&
      w.status === 'PENDING' &&
      w.committeeStage === 'NONE'
    ).length;
  }

  res.json({
    employee,
    isCommitteeMember: !!committee,
    committeeStage: committee ? committee.committeeStage : null,
    pendingEvaluations: pendingCount,
    myWorkResults: {
      total: myWorkResults.length,
      pending: myWorkResults.filter(w => w.status === 'PENDING').length,
      approved: myWorkResults.filter(w => w.status === 'APPROVED').length,
      rejected: myWorkResults.filter(w => w.status === 'REJECTED').length
    },
    totalEvaluationsDone: evaluationHistory.filter(e => e.evaluatorPernr === pernr).length
  });
});

// Reset data (for demo purposes)
app.post('/api/reset', (req, res) => {
  workResults = [];
  evaluationHistory = [];
  committeeMembers = [];
  initializeSampleData();
  res.json({ message: 'Data reset successfully' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Loaded ${employees.length} employees`);
  console.log(`Created ${committeeMembers.length} committee members`);
  console.log(`Created ${workResults.length} sample work results`);
});
