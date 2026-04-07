# AI Education Research Web MVP Demo Script

## Purpose

Use this script to demo the current MVP in a stable, repeatable order.

## Preconditions

- App running in `apps/web`
- Database seeded or at least one teacher/student can log in
- Recommended demo accounts:
  - teacher: `teacher@example.com`
  - student: `student@example.com`

## Demo Goal

Show that the system supports:
1. Teacher creates class and assignment
2. Student submits work
3. System produces either:
   - auto feedback
   - teacher review workflow
4. Teacher completes review task

---

## Flow A — Teacher setup

1. Open `/login`
2. Log in as `teacher@example.com` with role `teacher`
3. Go to `/teacher/classes`
4. Create a class
   - Example:
     - Name: `高一（演示班）`
     - Subject: `数学`
     - Grade: `高一`
5. Go to `/teacher/assignments/new`
6. Create an assignment
   - Example:
     - Title: `二次函数诊断`
     - Prompt: `请解答并说明推理过程`
     - Rubric: `步骤完整、依据清晰`
     - Tags: `公式误用, 推理缺口`

Expected result:
- Teacher can create class and assignment successfully
- Dashboard / class list / assignment flow remains available

---

## Flow B — Student triggers review queue

1. Open `/login`
2. Log in as `student@example.com` with role `student`
3. Go to `/student/home`
4. Open the latest assignment
5. Submit a low-confidence answer

Recommended review-path input:
- Answer: `答案可能是3`
- Reasoning: `我直接套公式，不太确定`

Expected result:
- Student is redirected to result page
- Result page shows review state
- `needsReview=true`
- Teacher review queue gets one new pending item

Why this works:
- The rule engine marks short / uncertain / formula-only answers as needing review

---

## Flow C — Student gets auto feedback

1. Stay with student account
2. Open another assignment attempt
3. Submit a more complete explanation

Recommended auto-path input:
- Answer: `顶点坐标为(1,-2)`
- Reasoning: `已知二次函数解析式后，我先利用配方法整理出顶点式，再根据定义判断开口方向，因此可以由此得到顶点坐标，并且再代回原式检查结果一致，所以结论成立。`

Expected result:
- Result page shows auto-feedback state
- `needsReview=false`
- Teacher review queue does not get a new pending item for this submission

---

## Flow D — Teacher completes review

1. Log back in as teacher
2. Open `/teacher/review-queue`
3. Open the pending review item
4. Click `确认` / `修订` / `驳回`

Expected result:
- Review task status updates successfully
- Pending item disappears from review queue
- Teacher identity is recorded as reviewer

---

## Stable Demo Rules Summary

### Triggers review (`needsReview=true`)
Use inputs with one or more of these traits:
- very short reasoning
- uncertain phrases like `不确定` / `可能` / `猜`
- formula mention without enough explanation

### Triggers auto feedback (`needsReview=false`)
Use inputs with these traits:
- longer reasoning
- at least basic step-by-step explanation
- fewer uncertainty signals

---

## Known Limitations

- Next 16 currently warns that `middleware` should migrate to `proxy`
- README at repo root is outdated and does not reflect actual MVP progress
- Teacher dashboard / insights are functional but still light on presentation polish

---

## Suggested Next Enhancements

1. Add demo seed data tailored for teacher dashboard and insights
2. Add explicit assignment detail text on student page for stronger demo clarity
3. Reflect reviewed status back to student-facing result/history views
