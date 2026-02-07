
# 🔐 Demo Credentials & Test Flow

## Quick Start

### 1. Create a Demo Account

**Option A: Email/Password**
```
Email: demo@securescribe.com
Password: SecureDemo123!
Name: Demo User
```

**Option B: Use Your Own Email**
```
Email: your-email@example.com
Password: (minimum 8 characters)
Name: Your Name
```

**Option C: OAuth**
- Use your Google account
- Use your Apple ID (iOS only)

---

## 📋 Complete Test Flow

### Step 1: Authentication
1. Open the app
2. Tap "Don't have an account? Sign Up"
3. Enter credentials (see above)
4. Tap "Sign Up"
5. ✅ You should be redirected to the Projects screen

### Step 2: Create Your First Project
1. Tap the "+" button (top right)
2. Fill in the form:
   ```
   Name: Meeting Notes
   Description: Transcribe and summarize team meetings
   Provider: OpenAI
   Model: GPT-4 (Deep Research)
   Prompt: Summarize the key points and action items from this meeting.
   PII Anonymization: ON
   ```
3. (Optional) Add custom fields:
   - Tap "+" next to "Custom Fields"
   - Enter field name: "Meeting Type"
   - Tap "+" again
   - Enter field name: "Attendees"
4. Tap "Create Project"
5. ✅ You should see "Success" modal
6. ✅ You should be redirected back to Projects list

### Step 3: Create a Recording
1. Tap on your "Meeting Notes" project
2. Tap "New Recording" button
3. Fill in custom fields (if you added them):
   ```
   Meeting Type: Standup
   Attendees: 5
   ```
4. Tap the microphone button (large blue circle)
5. Speak for 10-15 seconds:
   ```
   "Good morning team. Today we'll discuss the project status.
   We have two blockers that need attention. The first blocker
   is related to the API integration. The second blocker is
   about the database migration. Let's prioritize these issues."
   ```
6. Tap the stop button (large red circle)
7. Wait for upload (you'll see "Uploading and processing...")
8. ✅ You should see "Success" modal
9. ✅ You should be redirected back to the project

### Step 4: View Recording Status
1. You should see your recording in the list
2. Status badge will show:
   - 🟡 "Pending" → 🔵 "Transcribing" → 🟣 "Anonymizing" → 🟠 "Processing" → 🟢 "Done"
3. Pull down to refresh and check status updates
4. ✅ Wait until status is "Done" (may take 1-2 minutes)

### Step 5: View Recording Details
1. Tap on your recording
2. You should see:
   - ✅ Status badge (should be "Done")
   - ✅ Date/time of recording
   - ✅ Audio player with play/pause button
   - ✅ Transcription text
   - ✅ LLM Output (summary)
   - ✅ Custom field values
3. Tap the play button to listen to your recording
4. Tap the copy icon next to "LLM Output"
5. ✅ You should see "Copied" modal

### Step 6: Export CSV
1. Go back to the project
2. Tap "Export CSV" button
3. ✅ CSV file should be shared/downloaded
4. Open the CSV file to verify:
   - Columns: date, time, Meeting Type, Attendees, output
   - Your recording data should be present

### Step 7: Configure API Keys
1. Go to Settings tab (bottom navigation)
2. Scroll to "API Keys" section
3. Enter your API keys:
   ```
   OpenAI: sk-proj-...
   Google Gemini: AIza...
   Mistral AI: ...
   ```
4. Tap "Save API Keys"
5. ✅ You should see "Success" modal
6. ✅ Current keys should show as masked (e.g., "sk-...****")

### Step 8: Test Sign Out
1. Scroll to "Account" section
2. Tap "Sign Out"
3. ✅ You should be redirected to the auth screen
4. Sign back in with your credentials
5. ✅ You should see your projects and recordings

---

## 🎯 What to Verify

### Authentication ✅
- [ ] Sign up works
- [ ] Sign in works
- [ ] Session persists after reload (close and reopen app)
- [ ] Sign out works
- [ ] OAuth works (Google/Apple)

### Projects ✅
- [ ] Projects list loads
- [ ] Can create a project
- [ ] Can view project details
- [ ] Pull to refresh works
- [ ] Project shows recording count

### Recordings ✅
- [ ] Can create a recording
- [ ] Recording uploads successfully
- [ ] Status updates automatically
- [ ] Can view recording details
- [ ] Audio playback works
- [ ] Transcription is displayed
- [ ] LLM output is displayed
- [ ] Can copy LLM output
- [ ] Custom fields are saved and displayed

### Export ✅
- [ ] CSV export works
- [ ] CSV contains correct data
- [ ] CSV includes custom fields

### Settings ✅
- [ ] API keys load (masked)
- [ ] Can update API keys
- [ ] Success message shows
- [ ] Sign out works

---

## 🐛 Troubleshooting

### "Authentication token not found"
**Solution**: Sign out and sign back in

### "Failed to load projects"
**Solution**: 
1. Check internet connection
2. Verify backend is running
3. Check console logs

### Recording stuck in "Pending"
**Solution**:
1. Pull to refresh
2. Check that API keys are configured
3. Check backend logs

### Audio upload fails
**Solution**:
1. Check microphone permissions
2. Try recording again
3. Check file size (should be < 10MB)

### OAuth not working
**Solution**:
- **Web**: Enable popups in browser
- **Native**: Check OAuth redirect URLs in backend

---

## 📊 Expected Results

### After Creating a Project
```
✅ Project appears in list
✅ Project has 0 recordings
✅ Can tap to view details
```

### After Creating a Recording
```
✅ Recording appears in project
✅ Status: Pending → Transcribing → Anonymizing → Processing → Done
✅ Duration is displayed
✅ Date/time is displayed
```

### After Recording is Done
```
✅ Transcription is available
✅ LLM output is available
✅ Audio can be played
✅ Can copy LLM output
```

### After Exporting CSV
```
✅ CSV file is downloaded/shared
✅ Contains: date, time, custom fields, output
✅ One row per recording
```

---

## 🎉 Success Criteria

You've successfully tested the integration if:

1. ✅ You can sign up and sign in
2. ✅ You can create a project
3. ✅ You can create a recording
4. ✅ Recording processes successfully (status → Done)
5. ✅ You can view transcription and LLM output
6. ✅ You can export CSV
7. ✅ You can configure API keys
8. ✅ You can sign out and sign back in

---

## 📞 Need Help?

Check the console logs:
```bash
# Look for these prefixes:
[API] - API calls and responses
[ProjectsScreen] - Projects operations
[RecordingDetailScreen] - Recording operations
[SettingsScreen] - Settings operations
```

---

**Happy Testing! 🚀**
