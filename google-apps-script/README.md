# Google Apps Script Setup

## Step 1: Create Google Sheet

1. Create a new Google Sheet
2. Name it "I-Si Email Subscriptions"
3. Rename Sheet1 to "Subscriptions"
4. Add headers in row 1:
   - A1: id
   - B1: email
   - C1: lat
   - D1: lon
   - E1: location
   - F1: eventTypes
   - G1: minSeverity
   - H1: frequency
   - I1: digestTime
   - J1: isActive
   - K1: createdAt
   - L1: lastNotified
   - M1: verifiedAt
   - N1: unsubscribeToken

## Step 2: Create Apps Script Project

1. In your Google Sheet, go to Extensions > Apps Script
2. Delete the default code
3. Copy the entire content of `Code.gs` and paste it
4. At the top, replace `YOUR_GOOGLE_SHEET_ID` with your actual Sheet ID
   - Find it in the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

## Step 3: Deploy as Web App

1. Click "Deploy" > "New deployment"
2. Select type: "Web app"
3. Configuration:
   - Description: "I-Si Subscriptions API"
   - Execute as: "Me"
   - Who has access: "Anyone"
4. Click "Deploy"
5. Copy the Web App URL (looks like: `https://script.google.com/macros/s/...../exec`)

## Step 4: Configure Next.js App

1. Open `.env.local` in your Next.js project
2. Add:
   ```
   GOOGLE_SHEETS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

## Step 5: Test the Deployment

Test in browser:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getStats
```

Should return:
```json
{
  "total": 0,
  "active": 0,
  "inactive": 0,
  "byFrequency": {
    "immediate": 0,
    "daily": 0,
    "weekly": 0
  }
}
```

## Step 6: Migrate Existing Data (Optional)

If you have existing data in `data/subscriptions.json`:

1. Open the JSON file
2. For each subscription, manually add a row to the Google Sheet
3. Or use the Apps Script API to import programmatically

## Security Notes

- The Web App runs as YOU, so it has access to your Google Sheet
- Anyone with the URL can call the API, but they can't access your sheet directly
- Consider adding authentication if needed
- The unsubscribe token provides security for unsubscribe operations

## Maintenance

- View logs: Apps Script Editor > Executions
- Update code: Edit Code.gs and save (no need to redeploy for minor changes)
- Major changes: Create new deployment version
