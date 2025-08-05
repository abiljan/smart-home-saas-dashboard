# Smart Home SaaS Dashboard - Test Plan

## Overview
This document outlines comprehensive testing procedures for the Smart Home SaaS Dashboard, covering functionality, real-time features, error handling, and user experience.

## 1. System Health Monitoring Tests

### 1.1 Health Status Display
- **Test**: Verify all four service statuses are displayed
- **Expected**: API, Database, Real-time, External Services cards show status
- **Status Colors**: 
  - Green dot = Operational
  - Yellow dot = Degraded  
  - Red dot = Down

### 1.2 Health Metrics
- **Test**: Check service-specific metrics display
- **API Service**: Response time, uptime, requests/min
- **Database**: Query time, connections, storage used
- **Real-time**: Connections, messages/sec, last sync
- **External Services**: Stripe, Zendesk, Email service status dots

## 2. Business Metrics Dashboard Tests

### 2.1 Device Discovery Rate
- **Test**: Primary metric displays with percentage and progress bar
- **Expected**: Current rate, trend arrow, target/critical thresholds
- **Colors**: Green (≥90%), Yellow (85-89%), Red (<85%)

### 2.2 Business Metrics Card
- **Test**: MRR, Active Homes, Churn Rate display with trends
- **Expected**: Formatted currency, number formatting, trend indicators
- **Trend Arrows**: Up (green) for positive changes, Down (red) for negative

### 2.3 Support Overview
- **Test**: Support metrics and Zendesk integration button
- **Expected**: Open tickets, response time, satisfaction score
- **External Link**: "Open Zendesk" button opens in new tab

## 3. Emergency Controls Tests

### 3.1 Kill Switch Controls
- **Test**: Toggle each emergency setting
- **Settings**: Content Kill Switch, API Maintenance Mode, Sound Alerts
- **Expected**: 
  - Visual feedback on toggle
  - Toast notifications on change
  - Real-time updates via WebSocket

### 3.2 Setting States
- **Test**: Different colored backgrounds based on setting type
- **Content Kill Switch**: Red background when enabled
- **Maintenance Mode**: Yellow background when enabled  
- **Sound Alerts**: Blue background when enabled

### 3.3 Permission Controls
- **Test**: Settings should only be changeable by authorized users
- **Expected**: Proper authorization checks before allowing changes

## 4. Real-time Features Tests

### 4.1 WebSocket Connection
- **Test**: Connection establishment and maintenance
- **Expected**: "WebSocket connected" in console logs
- **Reconnection**: Auto-reconnect on connection loss

### 4.2 Live Data Updates
- **Test**: Dashboard refreshes every 3 minutes
- **Expected**: 
  - System health updates
  - Metric value changes
  - Activity log additions
  - Emergency setting changes broadcast

### 4.3 Message Types
- **Test**: Different WebSocket message types handled correctly
- **Types**: `system_health_updated`, `emergency_setting_updated`, `metrics_updated`

## 5. Critical Alerts Tests

### 5.1 Alert Display
- **Test**: Critical alerts appear in alerts bar
- **Expected**: Alert title, message, timestamp, dismiss button
- **Severity**: Color coding based on alert type

### 5.2 Browser Notifications
- **Test**: Critical alerts trigger browser notifications
- **Expected**: Native notification with title and body
- **Permission**: Request notification permission on load

### 5.3 Dismissal
- **Test**: Alerts can be dismissed and don't reappear
- **Expected**: Alert removed from active list, marked as dismissed

## 6. Activity Log Tests

### 6.1 Event Logging
- **Test**: Various activities logged with proper metadata
- **Event Types**: system_alert, user_action, system_info
- **Expected**: Title, description, severity, timestamp

### 6.2 Time Display
- **Test**: Relative time formatting
- **Expected**: "Just now", "5 min ago", "1 hour ago", "2 days ago"

### 6.3 Severity Indicators
- **Test**: Color-coded severity dots
- **Critical**: Red dot
- **Warning**: Yellow dot
- **Info**: Blue dot

## 7. API Endpoints Tests

### 7.1 Dashboard Summary
- **Endpoint**: `GET /api/dashboard-summary`
- **Expected**: Complete dashboard data including health, metrics, alerts, activities
- **Response Time**: < 100ms for in-memory data

### 7.2 Emergency Settings Update
- **Endpoint**: `PATCH /api/emergency-settings/{name}`
- **Expected**: Setting updated, WebSocket broadcast, activity log entry

### 7.3 Error Handling
- **Test**: API error responses handled gracefully
- **Expected**: User-friendly error messages, no crashes

## 8. User Interface Tests

### 8.1 Responsive Design
- **Test**: Dashboard on different screen sizes
- **Breakpoints**: Mobile (320px+), Tablet (768px+), Desktop (1024px+)
- **Expected**: Proper grid layout adjustments

### 8.2 Navigation
- **Test**: Header navigation and branding
- **Expected**: Smart Home SaaS title, notification bell, last updated time

### 8.3 Loading States
- **Test**: Loading indicators during data fetch
- **Expected**: Skeleton screens or spinners while loading

## 9. Performance Tests

### 9.1 Initial Load
- **Test**: Dashboard loads within acceptable time
- **Target**: < 2 seconds for initial render
- **Metrics**: Time to first paint, time to interactive

### 9.2 Real-time Updates
- **Test**: WebSocket updates don't cause performance issues
- **Expected**: Smooth animations, no UI freezing

### 9.3 Memory Usage
- **Test**: No memory leaks during extended use
- **Expected**: Stable memory usage over time

## 10. Error Scenarios Tests

### 10.1 Network Failures
- **Test**: Dashboard behavior when API is unavailable
- **Expected**: Error states, retry mechanisms, cached data display

### 10.2 WebSocket Disconnection
- **Test**: Handling of WebSocket connection loss
- **Expected**: Reconnection attempts, fallback to polling

### 10.3 Invalid Data
- **Test**: Malformed API responses
- **Expected**: Graceful degradation, error boundaries

## 11. Security Tests

### 11.1 Authentication
- **Test**: Unauthorized access prevention
- **Expected**: Proper authentication checks on sensitive operations

### 11.2 Input Validation
- **Test**: Emergency setting updates validate input
- **Expected**: Sanitized inputs, SQL injection prevention

### 11.3 XSS Prevention
- **Test**: User content properly escaped
- **Expected**: No script execution from user input

## Test Execution Checklist

### Manual Testing
- [ ] All dashboard components load correctly
- [ ] Emergency controls toggle properly
- [ ] WebSocket connection established
- [ ] Browser notifications work
- [ ] Responsive design on mobile/tablet
- [ ] External links (Zendesk) open correctly

### Automated Testing
- [ ] API endpoints return expected data structure
- [ ] WebSocket messages parsed correctly
- [ ] Emergency settings persist changes
- [ ] Activity logs created for actions

### Error Testing
- [ ] Network disconnection handled gracefully
- [ ] Invalid API responses don't crash app
- [ ] WebSocket reconnection works
- [ ] CORS issues resolved

## Known Issues to Address

1. **User rejected request (4001)**: Authentication/CORS errors in console
2. **Notification permission**: Browser blocking notifications by default
3. **Database connection**: Currently using in-memory fallback

## Success Criteria

- All dashboard components display correct data
- Real-time updates work without errors
- Emergency controls function properly
- No console errors during normal operation
- Responsive design works on all devices
- Performance meets acceptable thresholds