@echo off
echo ================================================
echo  Support Inbox Triage - Test Runner
echo ================================================
echo.

set WEBHOOK=http://localhost:5678/webhook/support-ticket

echo [TEST 1] Billing ticket (TCK_2001)...
powershell -Command "try { $r = Invoke-RestMethod -Method POST -Uri '%WEBHOOK%' -ContentType 'application/json' -Body '{\"ticketId\":\"TCK_2001\",\"name\":\"Ahmed Khan\",\"email\":\"ahmed.khan@example.com\",\"subject\":\"Incorrect charge on my invoice\",\"message\":\"I was overcharged $49 on my invoice. Please issue a refund.\",\"source\":\"website\"}'; Write-Host ('Response: ' + ($r | ConvertTo-Json)) } catch { Write-Host ('Response: ' + $_.ErrorDetails.Message) }"
timeout /t 3 /nobreak >nul

echo.
echo [TEST 2] Bug ticket HIGH priority (TCK_2003)...
powershell -Command "try { $r = Invoke-RestMethod -Method POST -Uri '%WEBHOOK%' -ContentType 'application/json' -Body '{\"ticketId\":\"TCK_2003\",\"name\":\"Usman Ali\",\"email\":\"usman.ali@techcorp.io\",\"subject\":\"App crashes on login urgent\",\"message\":\"Getting 500 error cannot access account critical issue ASAP\",\"source\":\"chat\"}'; Write-Host ('Response: ' + ($r | ConvertTo-Json)) } catch { Write-Host ('Response: ' + $_.ErrorDetails.Message) }"
timeout /t 3 /nobreak >nul

echo.
echo [TEST 3] Feature request (TCK_2005)...
powershell -Command "try { $r = Invoke-RestMethod -Method POST -Uri '%WEBHOOK%' -ContentType 'application/json' -Body '{\"ticketId\":\"TCK_2005\",\"name\":\"Bilal Hussain\",\"email\":\"bilal.h@agency.com\",\"subject\":\"Feature request dark mode\",\"message\":\"Would like to suggest adding dark mode to dashboard\",\"source\":\"website\"}'; Write-Host ('Response: ' + ($r | ConvertTo-Json)) } catch { Write-Host ('Response: ' + $_.ErrorDetails.Message) }"
timeout /t 3 /nobreak >nul

echo.
echo [TEST 4] General ticket (TCK_2007)...
powershell -Command "try { $r = Invoke-RestMethod -Method POST -Uri '%WEBHOOK%' -ContentType 'application/json' -Body '{\"ticketId\":\"TCK_2007\",\"name\":\"Hassan Qureshi\",\"email\":\"hassan.q@gmail.com\",\"subject\":\"General inquiry about services\",\"message\":\"Just signed up want to understand the features onboarding\",\"source\":\"chat\"}'; Write-Host ('Response: ' + ($r | ConvertTo-Json)) } catch { Write-Host ('Response: ' + $_.ErrorDetails.Message) }"

echo.
echo Waiting 10 seconds for Google Sheet to update before duplicate test...
timeout /t 10 /nobreak >nul

echo.
echo [TEST 5] DUPLICATE - same TCK_2007 (should return duplicate_ignored)...
powershell -Command "try { $r = Invoke-RestMethod -Method POST -Uri '%WEBHOOK%' -ContentType 'application/json' -Body '{\"ticketId\":\"TCK_2007\",\"name\":\"Hassan Qureshi\",\"email\":\"hassan.q@gmail.com\",\"subject\":\"General inquiry about services\",\"message\":\"Just signed up want to understand the features onboarding\",\"source\":\"chat\"}'; Write-Host ('Response: ' + ($r | ConvertTo-Json)) } catch { Write-Host ('Response: ' + $_.ErrorDetails.Message) }"
timeout /t 3 /nobreak >nul

echo.
echo [TEST 6] Validation error - missing email...
powershell -Command "try { $r = Invoke-RestMethod -Method POST -Uri '%WEBHOOK%' -ContentType 'application/json' -Body '{\"ticketId\":\"TCK_9999\",\"name\":\"Test User\",\"subject\":\"Missing email test\",\"message\":\"This should fail validation\",\"source\":\"website\"}'; Write-Host ('Response: ' + ($r | ConvertTo-Json)) } catch { Write-Host ('Response: ' + $_.ErrorDetails.Message) }"

echo.
echo ================================================
echo  All tests sent! Check n8n Executions list.
echo  Also check your Google Sheet for new rows.
echo ================================================
pause