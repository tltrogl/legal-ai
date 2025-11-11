# 💰 FREE AI Setup Guide - No API Costs!

This guide shows you how to use Lexi AI completely free without paying for OpenAI or Gemini APIs.

## 🎯 Quick Summary

You have **3 completely FREE options**:

| Option | Cost | Setup Time | Best For |
|--------|------|------------|----------|
| **Ollama (Local)** | 100% Free Forever | 5 minutes | Privacy, offline work |
| **Groq API** | Free Tier | 2 minutes | Speed, cloud access |
| **ChatGPT Extension** | Free with account | 10 minutes | Using existing ChatGPT |

---

## Option 1: Ollama (Recommended - 100% Free)

**Best for:** Privacy, working offline, no API costs ever

### What is Ollama?
Ollama runs AI models directly on your computer. No data leaves your machine, no API costs, works offline.

### Setup Steps:

1. **Download Ollama**
   - Visit: https://ollama.ai
   - Download for Windows/Mac/Linux
   - Install like any normal application

2. **Start Ollama**
   ```powershell
   # Ollama runs automatically on Windows after install
   # Or run manually:
   ollama serve
   ```

3. **Pull an AI Model**
   
   Choose one based on your computer:
   
   ```powershell
   # Fast & good quality (needs 8GB RAM)
   ollama pull llama3.1:8b
   
   # Better quality (needs 32GB+ RAM)
   ollama pull llama3.1:70b
   
   # Smallest option (needs 4GB RAM)
   ollama pull phi3:mini
   
   # For image analysis (needs 8GB RAM)
   ollama pull llava:latest
   ```

4. **Test It**
   ```powershell
   ollama run llama3.1:8b "Hello, are you working?"
   ```

5. **Use in Lexi AI**
   - Open Lexi AI application
   - Go to Settings → AI Provider
   - Select "Ollama (Local)"
   - Click "Test Connection"
   - You're done! ✅

### Troubleshooting:

**"Ollama not available"**
- Make sure Ollama is running: `ollama serve`
- Check if running: Open http://localhost:11434 in browser
- Should see: "Ollama is running"

**"No models found"**
- Pull a model first: `ollama pull llama3.1:8b`
- Verify: `ollama list`

**Slow responses**
- Use smaller model: `phi3:mini`
- Close other applications
- Consider cloud option (Groq) instead

---

## Option 2: Groq API (Fast & Free)

**Best for:** Speed, accessing from multiple devices

### What is Groq?
Groq provides fast, free API access to open-source models. No credit card needed.

### Setup Steps:

1. **Create Account**
   - Visit: https://console.groq.com
   - Sign up (free, no credit card)
   - Verify email

2. **Get API Key**
   - Click "API Keys" in sidebar
   - Click "Create API Key"
   - Copy the key (starts with `gsk_...`)

3. **Add to Lexi AI**
   - Open Lexi AI application
   - Go to Settings → AI Provider
   - Select "Groq (Free API)"
   - Paste your API key
   - Click "Save"
   - Click "Test Connection" ✅

### Free Tier Limits:
- **~14,400 tokens per minute**
- **~30 requests per minute**
- More than enough for legal work!

### Available Models (all free):
- `llama-3.3-70b-versatile` - Best quality
- `llama-3.1-8b-instant` - Fastest
- `mixtral-8x7b-32768` - Great for legal reasoning

### Troubleshooting:

**"API key invalid"**
- Double-check you copied the full key
- Make sure it starts with `gsk_`
- Try generating a new key

**"Rate limit exceeded"**
- Wait a minute and try again
- Groq resets limits every minute
- Consider Ollama for unlimited usage

---

## Option 3: ChatGPT Extension (Coming Soon)

**Status:** Under development

This option will use a browser extension to automate the free ChatGPT web interface.

**For now, use Ollama or Groq instead.**

---

## 🔄 Switching Between Providers

You can easily switch providers anytime:

1. Go to **Settings** tab
2. Click on any provider card
3. Click **"Test"** to verify it works
4. Provider is now active! ✅

Your preference is saved automatically.

---

## 💡 Which Provider Should I Choose?

### Choose **Ollama** if:
- ✅ You want 100% privacy (data never leaves your computer)
- ✅ You want to work offline
- ✅ You have 8GB+ RAM
- ✅ You never want to worry about API costs or limits

### Choose **Groq** if:
- ✅ You want the fastest responses
- ✅ You don't mind data being sent to Groq
- ✅ You need access from multiple devices
- ✅ Your computer has limited RAM

### Use Both!
Set up both and switch as needed:
- Use Ollama at home (private, unlimited)
- Use Groq on the go (fast, cloud-based)

---

## 📊 Feature Comparison

| Feature | Ollama | Groq | ChatGPT Extension |
|---------|--------|------|-------------------|
| **Cost** | Free | Free | Free |
| **Privacy** | 100% Private | Data sent to Groq | Data sent to OpenAI |
| **Speed** | Fast (local) | Very Fast | Medium |
| **Offline** | ✅ Yes | ❌ No | ❌ No |
| **Setup** | 5 minutes | 2 minutes | 10 minutes |
| **Limits** | None | 14,400 tokens/min | ChatGPT web limits |
| **Image Analysis** | ✅ llava model | ❌ Not yet | ✅ With GPT-4 |
| **Best For** | Privacy | Speed | Existing ChatGPT users |

---

## 🎓 Advanced Tips

### Ollama Pro Tips:

**1. Use Multiple Models**
```powershell
# Pull different models for different tasks
ollama pull llama3.1:8b      # General use
ollama pull llama3.1:70b     # Important documents
ollama pull llava:latest     # Image analysis
```

**2. Customize Model Behavior**
Edit models with custom parameters:
```powershell
ollama run llama3.1:8b --temperature 0.3  # More focused
ollama run llama3.1:8b --temperature 0.9  # More creative
```

**3. Monitor Resource Usage**
- Check Task Manager → Performance tab
- Ollama uses GPU if available
- Close model when not in use to free RAM

### Groq Pro Tips:

**1. Multiple API Keys**
- Create multiple free accounts (different emails)
- Switch keys if you hit rate limits
- Keep keys in Settings for quick switching

**2. Model Selection**
- Use `llama-3.1-8b-instant` for quick queries
- Use `llama-3.3-70b-versatile` for complex legal analysis
- Use `mixtral-8x7b` for long documents

---

## 🔒 Security & Privacy

### Ollama:
- ✅ **100% Private** - Everything runs locally
- ✅ **No internet required** after model download
- ✅ **No data collection**
- ✅ **Best for confidential legal work**

### Groq:
- ⚠️ **Data sent to Groq servers**
- ⚠️ **Don't use for highly sensitive cases**
- ✅ **Groq doesn't train on your data** (per their policy)
- ✅ **Good for general legal research**

### Recommendation:
- **Sensitive cases:** Use Ollama only
- **General research:** Groq is fine
- **Client data:** Always use Ollama or get client consent

---

## 📝 Quick Start Checklist

- [ ] Decide: Ollama (privacy) or Groq (speed)?
- [ ] Follow setup steps above
- [ ] Test connection in Settings
- [ ] Try a simple query in Case Chat
- [ ] Start using for real legal work! 🎉

---

## 🆘 Need Help?

### Common Issues:

**"No AI provider available"**
- Go to Settings → AI Provider
- Follow setup for Ollama or Groq
- Test connection

**"Request failed"**
- Check internet (for Groq)
- Check Ollama is running (for Ollama)
- Try switching providers

**Slow responses**
- Ollama: Use smaller model or close other apps
- Groq: Check internet connection
- Both: Consider upgrading hardware

### Still Stuck?
1. Check this guide again
2. Open GitHub Issues
3. Ask in Discussions

---

## 🚀 Ready to Go!

You now have multiple FREE options to run Lexi AI without any API costs!

**Next Steps:**
1. Choose a provider and set it up (5 minutes)
2. Test with a simple legal question
3. Start managing your cases! ⚖️

Remember: All these options are 100% free. No hidden costs, no credit card needed.

---

**Questions?** Open an issue on GitHub or check the discussions.

**Last Updated:** November 10, 2025
