# Video Script: Agentic in 100 Seconds

**Format:** Fast-paced overview
**Duration:** 100 seconds (1:40)
**Style:** Fireship.io inspired

---

## [0:00-0:10] Hook (10s)

**VISUAL:** Montage of AI coding tools (Copilot, Claude Code, GPT-4)

**NARRATION:**
"AI is writing code faster than ever. But there's a problem: **40-65% of it has bugs**. What if your programming language could make AI code actually trustworthy? Meet Agentic."

---

## [0:10-0:25] The Problem (15s)

**VISUAL:** Split screen - AI code on left, bugs highlighted on right

**NARRATION:**
"AI agents are probabilistic - they're uncertain. But languages like Python and JavaScript assume certainty. This mismatch causes bugs, security holes, and production failures."

**TEXT ON SCREEN:**
```
Traditional: All code looks equally confident
Result: You can't trust any of it
```

---

## [0:25-0:45] The Solution (20s)

**VISUAL:** Agentic code with annotations highlighted

**NARRATION:**
"Agentic makes uncertainty explicit. Every function declares its confidence level - and the compiler **verifies it**."

**CODE ON SCREEN:**
```agentic
@confidence(0.95)  // Verified!
@complete
@property("never returns null")
func safeDivide(a, b) -> Result<number, string> {
  if b == 0 { return Err("Division by zero") }
  return Ok(a / b)
}
```

**TEXT:** "✓ 1000 property tests ✓ 95% mutation score ✓ Z3 proven"

---

## [0:45-1:05] Key Features (20s)

**VISUAL:** Quick feature montage with code snippets

**NARRATION:**
"Agentic has confidence tracking, incremental stages from stub to complete, auto-generated property tests, formal verification with Z3, multi-agent coordination with session types, and beautiful Rust-quality error messages."

**TEXT ON SCREEN:**
- `@confidence(0.95)` - Verified scores
- `@stub → @partial → @complete` - Progressive development
- `@property()` - Auto-tests
- `@verify(z3)` - Formal proofs
- `@agent` - Multi-agent
- Beautiful errors

---

## [1:05-1:20] Demo (15s)

**VISUAL:** Terminal showing compilation

**NARRATION:**
"Install with npm, write your code, compile to TypeScript. The compiler warns about low confidence, suggests fixes, and validates everything automatically."

**TERMINAL:**
```bash
$ npm install -g agentic-lang
$ agentic compile auth.agentic
✓ Compiled successfully
⚠ Warning: Low confidence in parseDate (0.70)
✓ Property tests: 1000/1000 passed
✓ Mutation score: 92%
```

---

## [1:20-1:35] Unique Value (15s)

**VISUAL:** Comparison table with checkmarks

**NARRATION:**
"Agentic is the **only language** with verified confidence, multi-agent session types, AI-readable error recovery, and statistical validation. It's open source, MIT licensed, and built on research from PLDI, ICSE, and ACM."

**TABLE:**
| Feature | Agentic | Others |
|---------|---------|--------|
| Verified confidence | ✅ | ❌ |
| Session types | ✅ | ❌ |
| AI error recovery | ✅ | ❌ |

---

## [1:35-1:40] Call to Action (5s)

**VISUAL:** Website URL and QR code

**NARRATION:**
"Try it now at agentic-lang.org. Make AI code trustworthy."

**TEXT ON SCREEN:**
```
🌐 agentic-lang.org/playground
⭐ github.com/agentic-lang/agentic
💬 discord.gg/agentic
```

**END CARD:** "Agentic - Making AI Code Trustworthy"

---

## Production Notes

### B-Roll Needed
- AI coding tools in action (screen recordings)
- Terminal compilation sequences
- Test results scrolling
- Error messages (before/after)
- Multi-agent visualization
- VSCode with Agentic code

### Graphics
- Animated confidence score (0.60 → 0.95)
- Verification checkmarks appearing
- Agent communication diagram
- Type system visualization

### Music
- Fast-paced, tech-forward
- Similar to Fireship.io style

### Voiceover
- Professional, energetic
- Technical but accessible
- Clear pronunciation of "Agentic" (ah-JEN-tik)

---

## Alternative Versions

### **60-Second Version** (For Twitter/TikTok)
- Cut the demo section
- Focus on hook + solution + CTA

### **5-Minute Version** (For YouTube)
- Add live coding segment
- Show real bug being caught
- Demonstrate playground
- Interview with user

---

## SEO Optimization

**Title:** "Agentic in 100 Seconds - The AI-Native Programming Language"

**Description:**
"Agentic is the world's first programming language with verified confidence scores, multi-agent primitives, and formal verification for AI-generated code. Learn the basics in 100 seconds!"

**Tags:** #programming #AI #verification #formalmethods #typescript #coding #agentic

**Thumbnail:** Bold text "AI Code You Can TRUST" with code snippet background
