# Quick Start Guide - FDO Hygiene Monitoring System

## 🚀 Get Started in 5 Minutes

### Step 1: Open the Application
Open `index.html` in your web browser to access the Dashboard.

### Step 2: Explore Pre-loaded Data
The system comes with sample data already loaded:
- ✅ 5 Sample Projects
- ✅ 6 Hygiene Rules  
- ✅ 3 Active Issues
- ✅ 2 Notifications
- ✅ 5 Audit Log Entries

### Step 3: Navigate the Application

#### 📊 Dashboard (index.html)
- View real-time KPIs and metrics
- See active hygiene issues
- Visualize trends with charts
- **Try this**: Click "Run Hygiene Check" button to detect new issues

#### 📁 Projects (projects.html)
- View all projects and their health status
- **Try this**: Click "Add Project" to create a new project
- **Try this**: Click edit icon to modify an existing project

#### ⚙️ Hygiene Rules (hygiene-rules.html)
- View configured hygiene rules
- **Try this**: Click "Add Rule" to create a custom hygiene rule
- **Try this**: Toggle rule status using the play/pause button

#### 📧 Notifications (notifications.html)
- View notification history
- **Try this**: Click "Send Test Notification" to generate a test email
- **Try this**: Click envelope icon to preview email content

#### 📜 Audit Log (audit-log.html)
- Track all system activities
- **Try this**: Use filters to find specific events
- **Try this**: Click "Export Log" to download CSV

---

## 🎯 Common Workflows

### Running a Hygiene Check
1. Navigate to Dashboard
2. Click "Run Hygiene Check" button
3. System evaluates all projects against active rules
4. New issues are detected and notifications sent
5. Dashboard updates with new metrics

### Resolving an Issue
1. On Dashboard, find the issue in "Active Hygiene Issues" table
2. Click the green checkmark button
3. Confirm the resolution
4. Issue is marked as resolved
5. Resolution confirmation email is automatically sent

### Creating a New Project
1. Navigate to Projects page
2. Click "Add Project" button
3. Fill in project details:
   - Project Code (e.g., PROJ-006)
   - Project Name
   - Status and Stage
   - Project Manager name and email
   - Start/End dates
   - Description
   - Nominations
4. Click "Save Project"
5. Project is created and ready for hygiene checks

### Creating a Custom Rule
1. Navigate to Hygiene Rules page
2. Click "Add Rule" button
3. Configure rule:
   - Rule name
   - Category (Data Quality, Status, Nomination, etc.)
   - Severity (Critical, High, Medium, Low)
   - Description
   - Condition (field_empty, field_outdated, etc.)
   - Target field to check
   - Expected value
   - Corrective action
   - Enable checkbox
4. Click "Save Rule"
5. Rule is active and will be evaluated on next hygiene check

---

## 🔍 Key Features to Test

### 1. Real-time KPIs
- Total Issues count
- Pending Resolution count
- Resolved Today count
- Compliance Rate percentage

### 2. Interactive Charts
- Issues Trend Chart (7/14/30 days view)
- Issues by Category (Doughnut chart)

### 3. Search & Filter
- Search boxes on all tables
- Filter dropdowns (severity, status, category, etc.)
- Date filters on Audit Log

### 4. Modal Forms
- Clean, user-friendly forms
- Validation on required fields
- Edit mode pre-populates data

### 5. Action Buttons
- Edit (blue pencil icon)
- Delete (red trash icon)
- View/Preview (eye/envelope icon)
- Resolve (green checkmark)
- Enable/Disable (play/pause icon)

---

## 💡 Tips & Best Practices

### For Project Managers
1. Check Dashboard daily for new issues
2. Resolve issues promptly to maintain compliance
3. Keep project information up-to-date
4. Ensure nominations are complete

### For Administrators
1. Review and customize hygiene rules regularly
2. Monitor compliance rates and trends
3. Use audit log for troubleshooting
4. Export logs for reporting purposes

### For Testing
1. Run hygiene check after adding projects
2. Test different rule conditions
3. Verify notification content
4. Check audit log for all actions

---

## 📝 Sample Scenarios to Try

### Scenario 1: Detect Missing Nominations
1. Go to Projects → Edit "Cloud Migration Initiative"
2. Clear the Nominations field
3. Save the project
4. Go to Dashboard → Run Hygiene Check
5. Observe new issue detected for missing nominations

### Scenario 2: Resolve Issue and Get Confirmation
1. Find an open issue on Dashboard
2. Click resolve button (green checkmark)
3. Confirm resolution
4. Check Notifications page for resolution confirmation
5. Verify issue no longer appears in Active Issues

### Scenario 3: Create Critical Rule
1. Go to Hygiene Rules
2. Create rule: "Missing Project Manager"
3. Set severity to Critical
4. Target field: projectManager
5. Condition: field_empty
6. Enable the rule
7. Run hygiene check to detect violations

---

## 🎨 UI Features

### Dashboard
- **Clean modern design** with card-based layout
- **Color-coded badges** for severity and status
- **Interactive charts** powered by Chart.js
- **Responsive tables** with sorting and filtering

### Navigation
- **Sidebar menu** with active page highlighting
- **Consistent layout** across all pages
- **Icon-based navigation** for easy identification

### Notifications
- **Toast messages** for user actions
- **Modal dialogs** for forms and previews
- **Confirmation dialogs** for destructive actions

---

## 🔧 Customization Options

### Modify KPI Thresholds
Edit `js/dashboard.js` to change:
- Compliance rate calculation
- Issue severity thresholds
- Chart display periods

### Customize Email Templates
Edit email generation functions in `js/dashboard.js`:
- `generateIssueEmail()` - Issue notification template
- `generateResolutionEmail()` - Resolution confirmation template

### Add New Rule Conditions
Extend `evaluateRule()` function in `js/dashboard.js`:
```javascript
case 'your_new_condition':
    isViolation = // your logic here
    break;
```

### Change Styling
Modify `css/style.css`:
- Colors (CSS variables at top)
- Layout spacing
- Font sizes
- Component styles

---

## 📊 Understanding the Data

### Project Health Status
- **Healthy** 🟢 - No open issues
- **Warning** 🟡 - Has high-severity issues or 3+ issues
- **Critical** 🔴 - Has critical-severity issues

### Issue Severity
- **Critical** - Must be resolved immediately
- **High** - Should be resolved within 24-48 hours
- **Medium** - Should be resolved within 1 week
- **Low** - Should be resolved when possible

### Issue Status
- **Open** - Newly detected, not yet addressed
- **In Progress** - Being worked on by PM
- **Resolved** - Corrected and confirmed

---

## ❓ Troubleshooting

### No Issues Detected
- Verify projects exist (check Projects page)
- Verify rules are enabled (check Hygiene Rules page)
- Ensure rule conditions match project data
- Check browser console for errors

### Charts Not Displaying
- Ensure Chart.js CDN is accessible
- Check browser console for JavaScript errors
- Verify chart containers have proper height

### Data Not Saving
- Check browser console for API errors
- Verify Table API is configured correctly
- Ensure required fields are filled

---

## 🎓 Next Steps

After exploring the system:

1. **Customize Rules** - Adjust hygiene rules to match your organization's needs
2. **Add Real Projects** - Replace sample data with actual project information
3. **Set Up Scheduling** - Configure daily automated hygiene checks
4. **Integrate Email** - Connect to SMTP server for real email delivery
5. **Review Analytics** - Use dashboards and reports for insights

---

## 📚 Additional Resources

- **README.md** - Comprehensive system documentation
- **Code Comments** - Detailed inline documentation
- **Sample Data** - Pre-loaded examples for reference

---

## 🤝 Support

For questions or issues:
1. Check README.md for detailed documentation
2. Review code comments in JavaScript files
3. Check browser console for error messages
4. Refer to audit log for system activity

---

**Happy Monitoring! 🎉**

Maintain healthy projects and ensure governance compliance with automated hygiene monitoring.
