/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const MISCONCEPTION_TEXT = {
  concept_misunderstanding: "概念理解偏差",
  formula_misuse: "公式误用",
  reasoning_gap: "推理缺口",
};

async function resetDemoData() {
  await prisma.reviewTask.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await resetDemoData();

  const teacher = await prisma.user.create({
    data: {
      id: "teacher_demo_01",
      email: "teacher@example.com",
      name: "王老师",
      role: "teacher",
    },
  });

  const students = await Promise.all(
    Array.from({ length: 12 }, (_, idx) => {
      const no = idx + 1;
      return prisma.user.create({
        data: {
          id: `student_demo_${String(no).padStart(2, "0")}`,
          email: `student${String(no).padStart(2, "0")}@example.com`,
          name: `学生${String(no).padStart(2, "0")}`,
          role: "student",
        },
      });
    })
  );

  const classrooms = {
    math: await prisma.classroom.create({
      data: {
        id: "class_demo_math_g10",
        name: "高一数学",
        subject: "数学",
        grade: "高一",
        code: "DEMO-MATH-G10",
        teacherId: teacher.id,
      },
    }),
    physics: await prisma.classroom.create({
      data: {
        id: "class_demo_physics_g11",
        name: "高二物理",
        subject: "物理",
        grade: "高二",
        code: "DEMO-PHYS-G11",
        teacherId: teacher.id,
      },
    }),
    chemistry: await prisma.classroom.create({
      data: {
        id: "class_demo_chem_g9",
        name: "初三化学",
        subject: "化学",
        grade: "初三",
        code: "DEMO-CHEM-G9",
        teacherId: teacher.id,
      },
    }),
  };

  const now = Date.now();
  const assignments = {
    a1: await prisma.assignment.create({
      data: {
        id: "asg_demo_math_1",
        title: "二次函数图像性质诊断",
        prompt: "给定二次函数 y=ax²+bx+c，说明开口、顶点与对称轴的判断过程。",
        rubric: "关注概念准确性、步骤完整性、结果校验。",
        misconceptionTags: "concept_misunderstanding,formula_misuse,reasoning_gap",
        dueAt: new Date(now + 48 * 60 * 60 * 1000),
        classroomId: classrooms.math.id,
        teacherId: teacher.id,
      },
    }),
    a2: await prisma.assignment.create({
      data: {
        id: "asg_demo_math_2",
        title: "函数最值与顶点式应用",
        prompt: "将一般式转化为顶点式，求最值并解释参数意义。",
        rubric: "关注式形转换正确率与参数解释。",
        misconceptionTags: "formula_misuse,reasoning_gap",
        dueAt: new Date(now + 72 * 60 * 60 * 1000),
        classroomId: classrooms.math.id,
        teacherId: teacher.id,
      },
    }),
    a3: await prisma.assignment.create({
      data: {
        id: "asg_demo_phys_1",
        title: "牛顿第二定律综合题",
        prompt: "分析受力并列式，说明质量与加速度关系。",
        rubric: "关注受力分析完整性与单位规范。",
        misconceptionTags: "concept_misunderstanding,reasoning_gap",
        dueAt: new Date(now + 24 * 60 * 60 * 1000),
        classroomId: classrooms.physics.id,
        teacherId: teacher.id,
      },
    }),
    a4: await prisma.assignment.create({
      data: {
        id: "asg_demo_phys_2",
        title: "电路功率与效率计算",
        prompt: "根据串并联条件计算总功率，并说明能量损耗原因。",
        rubric: "关注公式适用条件、过程严谨度。",
        misconceptionTags: "formula_misuse,concept_misunderstanding",
        dueAt: new Date(now + 96 * 60 * 60 * 1000),
        classroomId: classrooms.physics.id,
        teacherId: teacher.id,
      },
    }),
    a5: await prisma.assignment.create({
      data: {
        id: "asg_demo_chem_1",
        title: "酸碱中和与离子方程式",
        prompt: "写出中和反应离子方程式，并解释配平依据。",
        rubric: "关注离子保留规则与配平步骤。",
        misconceptionTags: "concept_misunderstanding,reasoning_gap",
        dueAt: new Date(now + 60 * 60 * 1000 * 36),
        classroomId: classrooms.chemistry.id,
        teacherId: teacher.id,
      },
    }),
  };

  const plans = [
    // math a1
    ["a1", 0, "x=2", "由对称轴 x=-b/2a 得 x=2，再代入求顶点 y=-1，图像开口向上。", "concept_misunderstanding", 0.91, false],
    ["a1", 1, "x=-2", "我直接套了顶点公式，可能是 -2，不太确定。", "formula_misuse", 0.56, true],
    ["a1", 2, "x=1", "先看 a>0 开口向上，再算 b 与 a 的比值得到对称轴，最后验证顶点坐标。", "concept_misunderstanding", 0.87, false],
    ["a1", 3, "x=2", "我把 b 看成 4，所以对称轴算错，后面步骤跟着错。", "reasoning_gap", 0.78, false],
    ["a1", 4, "x=2", "根据判别式讨论根，再结合图像位置，结论与代入结果一致。", "concept_misunderstanding", 0.9, false],

    // math a2
    ["a2", 5, "y=(x-1)^2-3", "先配方得到顶点式，再说明最小值是 -3，发生在 x=1。", "formula_misuse", 0.85, false],
    ["a2", 6, "y=(x+1)^2+3", "配方时符号处理错误，把 -2x 看成 +2x，导致最值点偏移。", "formula_misuse", 0.73, false],
    ["a2", 7, "y=(x-1)^2-3", "公式记不清，猜是这个结果，没做校验。", "reasoning_gap", 0.59, true],
    ["a2", 8, "y=(x-1)^2-3", "用配方法后回代检验，代入 x=1 得到最小值，步骤完整。", "formula_misuse", 0.89, false],

    // physics a3
    ["a3", 9, "a=2m/s²", "先画受力图，合力 F=ma，列式后得 a=2，单位也检查过。", "concept_misunderstanding", 0.88, false],
    ["a3", 10, "a=4m/s²", "把摩擦力方向判反，合力多加了一项，所以加速度偏大。", "concept_misunderstanding", 0.77, false],
    ["a3", 11, "a=2m/s²", "先分解力，再按运动方向列牛二方程，最后对极端情况做合理性判断。", "concept_misunderstanding", 0.9, false],
    ["a3", 0, "a=1m/s²", "我猜测受力差不多抵消，直接写了 1。", "reasoning_gap", 0.54, true],

    // physics a4
    ["a4", 1, "P=36W", "先算总电阻，再用 P=U²/R 求功率，并比较串并联损耗差异。", "formula_misuse", 0.86, false],
    ["a4", 2, "P=48W", "把并联等效电阻算成相加，导致总功率过高。", "formula_misuse", 0.72, false],
    ["a4", 3, "P=36W", "电压和电流关系写清楚了，最终结果与单位匹配。", "concept_misunderstanding", 0.84, false],
    ["a4", 4, "P=30W", "套公式时没有先判断电路结构，可能用错了 R。", "formula_misuse", 0.57, true],

    // chemistry a5
    ["a5", 5, "H+ + OH- = H2O", "先写出电离，再去掉旁观离子，最后核对电荷守恒。", "concept_misunderstanding", 0.92, false],
    ["a5", 6, "Na+ + H+ + OH- = NaOH", "把旁观离子保留进了离子方程式，概念上有偏差。", "concept_misunderstanding", 0.75, false],
    ["a5", 7, "H+ + OH- = H2O", "步骤完整，解释了为何 Na+ 和 Cl- 不参与实质反应。", "concept_misunderstanding", 0.9, false],
    ["a5", 8, "H + OH = H2O", "离子电荷漏写了，配平过程也不完整，不太确定哪里错。", "concept_misunderstanding", 0.55, true],
  ];

  const reviewStatuses = ["pending", "confirmed", "revised", "rejected", "confirmed"];
  let reviewStatusCursor = 0;

  for (let i = 0; i < plans.length; i += 1) {
    const [assignmentKey, studentIndex, answer, reasoning, misconceptionType, confidence, needsReview] = plans[i];

    const assignment = assignments[assignmentKey];
    const student = students[studentIndex];

    const submission = await prisma.submission.create({
      data: {
        assignmentId: assignment.id,
        studentId: student.id,
        answer,
        reasoning,
        createdAt: new Date(now - (plans.length - i) * 60 * 60 * 1000),
      },
    });

    const diagnosis = await prisma.diagnosis.create({
      data: {
        submissionId: submission.id,
        misconceptionType,
        confidence,
        needsReview,
        evidence: `系统识别：${MISCONCEPTION_TEXT[misconceptionType]}，并结合学生过程文本给出证据链。`,
        suggestion: needsReview
          ? "该样本置信度较低，建议教师确认误区归因后再下发反馈。"
          : "可直接自动反馈：先肯定关键步骤，再给出 1 道同类变式练习。",
        createdAt: new Date(now - (plans.length - i) * 60 * 60 * 1000 + 10 * 60 * 1000),
      },
    });

    if (needsReview) {
      const status = reviewStatuses[reviewStatusCursor] || "pending";
      reviewStatusCursor += 1;

      await prisma.reviewTask.create({
        data: {
          diagnosisId: diagnosis.id,
          reviewerId: teacher.id,
          status,
          note: status === "pending" ? "待王老师确认归因" : `已由王老师处理：${status}`,
          createdAt: new Date(now - (plans.length - i) * 60 * 60 * 1000 + 15 * 60 * 1000),
          updatedAt: new Date(now - (plans.length - i) * 60 * 60 * 1000 + 25 * 60 * 1000),
        },
      });
    }
  }

  const [classCount, assignmentCount, submissionCount, diagnosisCount, reviewTaskCount] = await Promise.all([
    prisma.classroom.count(),
    prisma.assignment.count(),
    prisma.submission.count(),
    prisma.diagnosis.count(),
    prisma.reviewTask.count(),
  ]);

  console.log("✅ Demo seed complete");
  console.log(`- classes: ${classCount}`);
  console.log(`- assignments: ${assignmentCount}`);
  console.log(`- submissions: ${submissionCount}`);
  console.log(`- diagnoses: ${diagnosisCount}`);
  console.log(`- reviewTasks: ${reviewTaskCount}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
