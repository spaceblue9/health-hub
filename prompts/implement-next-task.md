# Implement Next Task

Project: Tacking Timeline Anything
Type: Web App
Documents available: prd.md, architecture.md, tasks.md, design.md, memory.md, rules.md, context.md, api.md, database.md
Primary goal: ผมมีปัญหาในการเล่ารายละเอียดให้คุณหมอฟังว่าคุณแม่ ประสบอุบัติเหตุเมื่่อไหร่ ที่ไหนอย่างไร มาหาหมอเมื่อไหร่ ได้ยาอะไรบ้าง มีแพ้ยาไหม เกิดเป็นโรคอะไรเมื่อไหร่ อายุเท่าไหร่ น้ำหนักเท่าไหร่ ส่วนสูงเท่าไหร่ ความดันเท่าไหร่ วัดวันไหน และการเก็บเอกสาร เช่นใบนัด ใบ X-ray และเอกสารต่างๆ
Prompt pack level: standard
Platform instruction: Treat this as a browser-based web application first. Prefer responsive web implementation unless the documents explicitly request native mobile or desktop code.
Respond bilingually in Thai and English where useful.

Use tasks.md as the source of truth. Pick the highest-priority unfinished task, state key assumptions, implement it, then update tasks.md and changelog.md.