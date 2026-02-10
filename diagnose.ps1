$ErrorActionPreference = 'Stop';
Write-Host "Waiting for HMR..." -NoNewline;
Start-Sleep -Seconds 3;
Write-Host "Done.";

Write-Host "`n--- CHECKING DEBUG-DB ---";
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/debug-db" -Method GET -UseBasicParsing;
    Write-Host "Success: $($response.Content)";
} catch {
    Write-Host "Failed: $($_.Exception.Message)";
    if ($_.Exception.Response) {
         $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream());
         Write-Host "Response Body: $($reader.ReadToEnd())";
    }
}

Write-Host "`n--- CHECKING DEBUG-NOTIFY ---";
$headers = @{
    "Authorization" = "Bearer 2e251595f0cd27ee1e6bb614f536aab66528bd653516fed61a7f5e46ef076667";
    "Content-Type" = "application/json"
};
$body = '{"title": "Test Diagnostic", "body": "Checking system health 🩺"}';

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/notify" -Method POST -Headers $headers -Body $body -UseBasicParsing;
    Write-Host "Success: $($response.Content)";
} catch {
    Write-Host "Failed: $($_.Exception.Message)";
    if ($_.Exception.Response) {
         $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream());
         Write-Host "Response Body: $($reader.ReadToEnd())";
    }
}
