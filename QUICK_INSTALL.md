# ⚡ Quick Install & First Steps

## 📦 **Install (10 seconds)**

```bash
npm install -g agentic-lang
```

## ✅ **Verify Installation**

```bash
agentic --version
# Should show: 0.2.0
```

## 🎯 **Your First Program (2 minutes)**

### **Step 1: Create a file**

```bash
cat > hello.agentic << 'EOF'
@confidence(0.95)
@complete
@property("greets with Hello")
func greet(name: string) -> string {
  return "Hello, " + name + "!"
}
EOF
```

### **Step 2: Compile it**

```bash
agentic compile hello.agentic
```

### **Step 3: See the result**

```bash
cat hello.ts
```

You'll see TypeScript code with runtime library imports!

---

## 🚀 **What Next?**

### **Learn the Basics**

```bash
# Interactive getting started guide
agentic learn

# See all examples
agentic examples

# Start the tutorial
agentic tutorial
```

### **Explore Examples**

The package includes 16 example files:

```bash
# View an example
cat node_modules/agentic-lang/examples/showcase.agentic

# Or if installed globally, examples are in:
# /usr/local/lib/node_modules/agentic-lang/examples/ (Mac/Linux)
# C:\Users\<username>\AppData\Roaming\npm\node_modules\agentic-lang\examples\ (Windows)
```

### **Read Documentation**

```bash
# Open docs in browser
agentic docs

# Or visit GitHub
# https://github.com/VyasSathya/AgenticLang/tree/main/docs
```

---

## 💡 **Key Commands**

```bash
agentic learn       # Getting started guide
agentic examples    # List all examples
agentic tutorial    # Start interactive tutorial
agentic docs        # Open documentation
agentic why         # Learn why Agentic is special
agentic --help      # Show all commands
```

---

## 🎓 **Learning Path**

1. **Run:** `agentic learn` (5 minutes)
2. **Read:** [Tutorial 1: Hello World](https://github.com/VyasSathya/AgenticLang/blob/main/docs/tutorials/01-hello-world.md) (15 min)
3. **Try:** Examples in `examples/` directory (30 min)
4. **Build:** Your first AI agent with Agentic! (1 hour)

---

## 🌟 **What You Can Build**

- ✅ **AI Agents** with confidence tracking
- ✅ **Multi-agent systems** with type-safe coordination
- ✅ **Formally verified** algorithms
- ✅ **Self-healing services** with health checks
- ✅ **Production APIs** with comprehensive error handling

---

## 🔗 **Links**

- **GitHub:** https://github.com/VyasSathya/AgenticLang
- **Tutorials:** https://github.com/VyasSathya/AgenticLang/tree/main/docs/tutorials
- **Examples:** https://github.com/VyasSathya/AgenticLang/tree/main/examples
- **Blog:** https://github.com/VyasSathya/AgenticLang/tree/main/blog

---

## 🆘 **Need Help?**

- **Command:** `agentic learn`
- **GitHub Issues:** https://github.com/VyasSathya/AgenticLang/issues
- **Discussions:** https://github.com/VyasSathya/AgenticLang/discussions

---

**Welcome to the future of AI-native programming!** 🚀
