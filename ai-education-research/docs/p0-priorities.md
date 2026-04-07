# P0 Priorities — AI Education Research Web MVP

## Current State

The MVP already supports a real end-to-end path:
- teacher login
- class creation
- assignment creation
- student submission
- diagnosis generation
- teacher review queue
- review task resolution

The highest-value work is no longer basic routing. It is demo stability, clarity, and presentation quality.

## P0 Priorities

### P0-1. Keep diagnosis/review deterministic
Reason:
- Demo and QA must be reproducible
- Random branching destroys trust during live walkthroughs

Acceptance:
- Same input always produces same diagnosis result
- Review-path and auto-path can both be reproduced on demand

### P0-2. Make review workflow visibly complete
Reason:
- The most differentiating part of the MVP is not just AI feedback, but teacher-in-the-loop review

Acceptance:
- Pending review appears for low-confidence submission
- Teacher can confirm/revise/reject
- Queue updates immediately after action

### P0-3. Strengthen demo clarity
Reason:
- Even a working MVP feels weak if the operator has to explain hidden logic verbally

Acceptance:
- Result page clearly explains whether the submission entered review or auto-feedback
- Demo script exists and can be followed by another operator

## P1 Candidates

- Dashboard data polish
- Insights presentation polish
- Better seed/demo fixtures
- Student history / reviewed-result backflow

## Not P0 Right Now

- Major refactor
- Broad UI redesign
- Non-MVP feature expansion
- Deployment optimization before demo narrative is clean
