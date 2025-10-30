# Kiro Web Mind Troubleshooting Guide

## Table of Contents
1. [Common Issues](#common-issues)
2. [Chrome Extension Problems](#chrome-extension-problems)
3. [Dashboard Issues](#dashboard-issues)
4. [AI Processing Problems](#ai-processing-problems)
5. [Voice Interface Issues](#voice-interface-issues)
6. [Performance Problems](#performance-problems)
7. [Data Sync Issues](#data-sync-issues)
8. [Authentication Problems](#authentication-problems)
9. [Network and Connectivity](#network-and-connectivity)
10. [Getting Help](#getting-help)

## Common Issues

### Extension Not Working

**Symptoms:**
- AI sidebar doesn't appear
- Extension icon is grayed out
- No response to clicks or commands

**Solutions:**

1. **Check Extension Status:**
   - Go to `chrome://extensions/`
   - Ensure "Kiro Web Mind" is enabled
   - Look for any error messages

2. **Reload the Extension:**
   - Click the refresh icon next to the extension
   - Refresh the webpage you're testing on

3. **Check Permissions:**
   - Verify all required permissions are granted
   - Re-grant permissions if necessary

4. **Clear Extension Data:**
   ```
   1. Go to chrome://extensions/
   2. Click "Details" on Kiro Web Mind
   3. Click "Extension options"
   4. Clear all data and restart
   ```

### Dashboard Won't Load

**Symptoms:**
- Blank page or loading spinner
- "Failed to load" error messages
- Slow or unresponsive interface

**Solutions:**

1. **Check Internet Connection:**
   - Verify you have a stable internet connection
   - Try accessing other websites

2. **Clear Browser Cache:**
   ```
   1. Press Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
   2. Select "All time" for time range
   3. Check "Cached images and files"
   4. Click "Clear data"
   ```

3. **Disable Other Extensions:**
   - Temporarily disable other browser extensions
   - Test if Kiro works without conflicts

4. **Try Incognito Mode:**
   - Open an incognito/private browsing window
   - Test if the dashboard loads properly

## Chrome Extension Problems

### Sidebar Not Appearing

**Possible Causes:**
- Website blocks extension injection
- Page content not recognized as suitable
- Extension permissions insufficient

**Solutions:**

1. **Manual Activation:**
   - Click the Kiro icon in the browser toolbar
   - Use keyboard shortcut: Ctrl+Shift+K (Cmd+Shift+K on Mac)

2. **Check Page Compatibility:**
   - Ensure the page has readable content
   - Try on different websites (news articles work best)
   - Avoid pages with heavy JavaScript frameworks that might interfere

3. **Verify Permissions:**
   ```
   1. Right-click the Kiro extension icon
   2. Select "This can read and change site data"
   3. Choose "On all sites"
   ```

### Content Script Errors

**Symptoms:**
- Console errors mentioning Kiro
- Partial functionality
- Unexpected behavior

**Debugging Steps:**

1. **Open Developer Tools:**
   - Press F12 or right-click → "Inspect"
   - Check the Console tab for errors
   - Look for red error messages

2. **Check Content Script Loading:**
   ```javascript
   // In console, check if Kiro is loaded
   console.log(window.kiro);
   ```

3. **Reload and Monitor:**
   - Refresh the page with DevTools open
   - Watch for any loading errors

### Extension Update Issues

**Symptoms:**
- Old version still running
- New features not available
- Inconsistent behavior

**Solutions:**

1. **Force Update:**
   ```
   1. Go to chrome://extensions/
   2. Enable "Developer mode" (top right)
   3. Click "Update" button
   4. Restart Chrome
   ```

2. **Reinstall Extension:**
   ```
   1. Remove the extension
   2. Restart Chrome
   3. Reinstall from Chrome Web Store
   4. Reconfigure settings
   ```

## Dashboard Issues

### Login Problems

**Symptoms:**
- Can't sign in to dashboard
- "Invalid credentials" errors
- Redirect loops

**Solutions:**

1. **Check Credentials:**
   - Verify email and password are correct
   - Try password reset if needed

2. **Clear Authentication Data:**
   ```
   1. Go to dashboard settings
   2. Click "Sign Out"
   3. Clear browser cookies for the site
   4. Sign in again
   ```

3. **Check Account Status:**
   - Verify your account is active
   - Check for any suspension notices

### Knowledge Graph Not Loading

**Symptoms:**
- Empty or broken graph visualization
- "No data available" messages
- Graph elements not interactive

**Solutions:**

1. **Wait for Data Processing:**
   - New accounts need time to build knowledge graph
   - Use Kiro for a few days to accumulate data

2. **Check Data Permissions:**
   - Ensure data collection is enabled in settings
   - Verify cloud sync is turned on

3. **Browser Compatibility:**
   - Use a modern browser (Chrome 88+, Firefox 85+, Safari 14+)
   - Enable JavaScript and WebGL

### Automation Rules Not Working

**Symptoms:**
- Rules created but not executing
- Partial execution of actions
- No automation history

**Debugging:**

1. **Check Rule Configuration:**
   - Verify trigger conditions are correct
   - Test with simple, broad conditions first

2. **Monitor Execution:**
   - Go to Automation Hub → History
   - Look for execution logs and errors

3. **Test Manually:**
   - Use "Test Rule" feature in automation editor
   - Verify each action works independently

## AI Processing Problems

### Summarization Not Working

**Symptoms:**
- "AI service unavailable" errors
- Very slow processing times
- Poor quality summaries

**Solutions:**

1. **Check AI Service Status:**
   - Verify Gemini Nano is available in your browser
   - Check Chrome version (requires Chrome 88+)

2. **Content Quality:**
   - Ensure page has sufficient text content (minimum 200 words)
   - Try on well-formatted articles

3. **Fallback Processing:**
   - If local AI fails, cloud processing should activate
   - Check internet connection for cloud fallback

### Suggestions Not Relevant

**Symptoms:**
- Generic or unhelpful suggestions
- Suggestions don't match content
- No suggestions appearing

**Improvements:**

1. **Train the System:**
   - Rate suggestions (thumbs up/down)
   - Use Kiro regularly to improve learning

2. **Update Preferences:**
   - Go to Settings → AI Preferences
   - Update your interests and topics

3. **Provide Context:**
   - Select specific text before requesting suggestions
   - Use voice commands to be more specific

## Voice Interface Issues

### Microphone Not Working

**Symptoms:**
- "Microphone access denied" errors
- Voice commands not recognized
- No audio input detected

**Solutions:**

1. **Check Permissions:**
   ```
   1. Click the microphone icon in address bar
   2. Select "Always allow" for microphone access
   3. Refresh the page
   ```

2. **Test Microphone:**
   - Try other voice applications (Google Voice Search)
   - Check system microphone settings
   - Ensure microphone is not muted

3. **Browser Settings:**
   ```
   1. Go to chrome://settings/content/microphone
   2. Ensure the site is allowed
   3. Check default microphone device
   ```

### Voice Recognition Accuracy

**Symptoms:**
- Commands frequently misunderstood
- Poor transcription quality
- Voice activation not working

**Improvements:**

1. **Environment:**
   - Use in quiet environment
   - Speak clearly and at normal pace
   - Position microphone appropriately

2. **Settings Adjustment:**
   - Go to Voice Settings in dashboard
   - Adjust sensitivity levels
   - Try different wake words

3. **Language Settings:**
   - Verify correct language is selected
   - Match browser language with voice settings

## Performance Problems

### Slow Loading Times

**Symptoms:**
- Dashboard takes long to load
- AI processing is very slow
- Extension feels sluggish

**Optimizations:**

1. **Browser Performance:**
   - Close unnecessary tabs
   - Disable unused extensions
   - Clear browser cache regularly

2. **System Resources:**
   - Check available RAM and CPU
   - Close other resource-intensive applications
   - Restart browser periodically

3. **Network Optimization:**
   - Use wired connection when possible
   - Check for background downloads
   - Test on different networks

### High Memory Usage

**Symptoms:**
- Browser becomes slow or unresponsive
- System memory warnings
- Frequent crashes

**Solutions:**

1. **Extension Settings:**
   - Reduce data retention period
   - Disable unnecessary features
   - Clear stored data regularly

2. **Browser Management:**
   - Use Chrome's Task Manager (Shift+Esc)
   - Identify memory-heavy tabs
   - Restart browser when needed

## Data Sync Issues

### Data Not Syncing

**Symptoms:**
- Changes in extension not reflected in dashboard
- Old data appearing
- Sync status shows errors

**Solutions:**

1. **Check Sync Settings:**
   - Verify cloud sync is enabled
   - Check internet connection
   - Look for sync error messages

2. **Manual Sync:**
   - Go to Settings → Data & Privacy
   - Click "Sync Now" button
   - Wait for completion confirmation

3. **Conflict Resolution:**
   - If conflicts exist, choose which data to keep
   - Consider exporting data before resolving

### Data Loss or Corruption

**Symptoms:**
- Missing activity history
- Corrupted knowledge graph
- Settings reset unexpectedly

**Recovery:**

1. **Check Backups:**
   - Go to Settings → Data & Privacy
   - Look for automatic backups
   - Restore from most recent backup

2. **Export Current Data:**
   - Export remaining data immediately
   - Contact support with export file

3. **Account Recovery:**
   - Try signing out and back in
   - Check if data appears after re-sync

## Authentication Problems

### Can't Sign In

**Symptoms:**
- Login page won't load
- Credentials rejected
- Two-factor authentication issues

**Solutions:**

1. **Basic Troubleshooting:**
   - Check email and password carefully
   - Try password reset
   - Disable browser password manager temporarily

2. **Two-Factor Authentication:**
   - Ensure device time is correct
   - Try backup codes if available
   - Contact support to reset 2FA

3. **Account Issues:**
   - Check for account suspension emails
   - Verify email address is confirmed
   - Try different browser or device

### Session Expires Frequently

**Symptoms:**
- Frequent "Please sign in again" messages
- Session timeout errors
- Lost work due to authentication

**Solutions:**

1. **Browser Settings:**
   - Enable cookies for the site
   - Disable "Clear cookies on exit"
   - Add site to exceptions list

2. **Security Settings:**
   - Check if VPN is interfering
   - Disable strict privacy modes temporarily
   - Whitelist Kiro domains

## Network and Connectivity

### Offline Functionality

**Symptoms:**
- Features stop working without internet
- "Connection lost" messages
- Data not saved when offline

**Understanding Offline Mode:**

1. **What Works Offline:**
   - Basic text summarization (Gemini Nano)
   - Viewing cached data
   - Creating automation rules (saved locally)

2. **What Requires Internet:**
   - Cloud AI processing
   - Data synchronization
   - Dashboard access
   - Voice processing

3. **Offline Best Practices:**
   - Enable offline mode in settings
   - Regularly sync when online
   - Export important data

### Firewall and Proxy Issues

**Symptoms:**
- Connection timeouts
- "Blocked by network policy" errors
- Partial functionality

**Solutions:**

1. **Network Administrator:**
   - Contact IT department
   - Request whitelisting of Kiro domains
   - Provide list of required endpoints

2. **Required Domains:**
   ```
   *.firebaseapp.com
   *.googleapis.com
   *.google.com
   kiro-web-mind.web.app
   ```

3. **Proxy Configuration:**
   - Configure browser proxy settings
   - Test with direct connection
   - Use VPN if necessary

## Getting Help

### Self-Service Resources

1. **Documentation:**
   - [User Manual](./user-manual.md)
   - [API Documentation](./api/README.md)
   - [Developer Guide](./developer-guide.md)

2. **Community:**
   - [GitHub Discussions](https://github.com/your-org/kiro-web-mind/discussions)
   - [Discord Community](https://discord.gg/kiro-web-mind)
   - [Reddit Community](https://reddit.com/r/kiro-web-mind)

### Diagnostic Information

When contacting support, please provide:

1. **System Information:**
   - Operating system and version
   - Browser type and version
   - Extension version
   - Dashboard URL

2. **Error Details:**
   - Exact error messages
   - Steps to reproduce
   - Screenshots if applicable
   - Browser console logs

3. **Account Information:**
   - Account email (don't include password)
   - Approximate time of issue
   - Affected features

### Collecting Debug Information

1. **Browser Console Logs:**
   ```
   1. Press F12 to open DevTools
   2. Go to Console tab
   3. Reproduce the issue
   4. Right-click in console → "Save as..."
   ```

2. **Extension Logs:**
   ```
   1. Go to chrome://extensions/
   2. Enable "Developer mode"
   3. Click "Inspect views: background page"
   4. Check console for errors
   ```

3. **Network Activity:**
   ```
   1. Open DevTools → Network tab
   2. Reproduce the issue
   3. Look for failed requests (red entries)
   4. Right-click → "Save all as HAR"
   ```

### Contact Support

- **Email**: support@kiro-web-mind.com
- **Priority Support**: premium@kiro-web-mind.com (for paid users)
- **Bug Reports**: [GitHub Issues](https://github.com/your-org/kiro-web-mind/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/your-org/kiro-web-mind/discussions)

### Response Times

- **General Support**: 24-48 hours
- **Bug Reports**: 1-3 business days
- **Priority Support**: 4-8 hours
- **Critical Issues**: 1-2 hours

---

## Emergency Procedures

### Complete Reset

If all else fails, perform a complete reset:

1. **Backup Data:**
   - Export all data from dashboard
   - Save important automation rules
   - Note custom settings

2. **Remove Extension:**
   - Uninstall from Chrome
   - Clear all browser data for Kiro sites

3. **Reset Account:**
   - Contact support for account reset
   - Or create new account if necessary

4. **Reinstall:**
   - Install fresh extension
   - Reconfigure settings
   - Import backed up data

### Data Recovery

If you've lost important data:

1. **Check Recent Backups:**
   - Look in Settings → Data & Privacy
   - Check email for backup notifications

2. **Contact Support Immediately:**
   - Don't make changes that might overwrite data
   - Provide account details and timeline

3. **Temporary Workarounds:**
   - Use browser history to reconstruct activity
   - Check cached data in browser storage

Remember: Most issues can be resolved with basic troubleshooting. Don't hesitate to reach out for help if you're stuck!