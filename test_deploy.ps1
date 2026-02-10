$headers = @{
    "Authorization" = "Bearer 2e251595f0cd27ee1e6bb614f536aab66528bd653516fed61a7f5e46ef076667"
    "Content-Type"  = "application/json"
}
# Emojis removed to prevent JSON parsing errors in PowerShell
$bodyContent = @{
    title = "SPOT Mobile Test"
    body  = "PWA ve mobil bildirim sistemi harika calisiyor!"
    url   = "https://spot.systemconf.online/dashboard"
}
$bodyJson = $bodyContent | ConvertTo-Json -Depth 1

Write-Host "Sending to Production..."
try {
    $req = [System.Net.HttpWebRequest]::Create("https://spot.systemconf.online/api/notify")
    $req.Method = "POST"
    $req.ContentType = "application/json"
    $req.Headers.Add("Authorization", "Bearer 2e251595f0cd27ee1e6bb614f536aab66528bd653516fed61a7f5e46ef076667")
    
    $writer = [System.IO.StreamWriter]::new($req.GetRequestStream())
    $writer.Write($bodyJson)
    $writer.Close()

    $resp = $req.GetResponse()
    $reader = [System.IO.StreamReader]::new($resp.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    
    Write-Host "Success! Response: $responseBody"
}
catch {
    Write-Host "Failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        Write-Host "Details: $($reader.ReadToEnd())"
    }
}
