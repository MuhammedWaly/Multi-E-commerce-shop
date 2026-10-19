<#
.SYNOPSIS
    Validates a task document against documented Stage A lifecycle transition rules and approval log integrity.

.DESCRIPTION
    Checks:
    1. Mandatory task metadata fields exist.
    2. Target status transition is valid according to the documented state machine:
       PROPOSED -> PENDING_OWNER_APPROVAL, REJECTED
       PENDING_OWNER_APPROVAL -> APPROVED, REJECTED, CHANGES_REQUESTED
       APPROVED -> IN_PROGRESS
       IN_PROGRESS -> IN_REVIEW
       IN_REVIEW -> DONE, CHANGES_REQUESTED
       CHANGES_REQUESTED -> IN_PROGRESS
       REJECTED -> (terminal)
       DONE -> (terminal)
    3. If target status is APPROVED or later, a corresponding valid approval record must exist in the approval log.
    4. Exits with 0 on valid, 1 on invalid.
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$TaskPath,

    [Parameter(Mandatory = $true)]
    [string]$ApprovalLogPath,

    [Parameter(Mandatory = $false)]
    [string]$TargetStatus
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $TaskPath)) {
    Write-Error "Task file does not exist: $TaskPath"
    exit 1
}

if (-not (Test-Path $ApprovalLogPath)) {
    Write-Error "Approval log does not exist: $ApprovalLogPath"
    exit 1
}

$taskContent = Get-Content $TaskPath -Raw

# Extract Task ID
if ($taskContent -match '\*\*Task ID\*\*\s*\|\s*([^\s\|]+)') {
    $taskId = $matches[1].Trim()
} else {
    Write-Error "Task ID metadata missing from $TaskPath"
    exit 1
}

# Extract current Status
if ($taskContent -match '\*\*Status\*\*\s*\|\s*([^\s\|]+)') {
    $currentStatus = $matches[1].Trim()
} else {
    Write-Error "Status metadata missing from $TaskPath"
    exit 1
}

# Extract Execution Mode
if ($taskContent -match '\*\*Execution Mode\*\*\s*\|\s*([^\r\n\|]+)') {
    $execMode = $matches[1].Trim()
} else {
    $execMode = "TBD"
}

Write-Host "Task: $taskId | Current Status: $currentStatus | Target Status: $TargetStatus"

if ([string]::IsNullOrWhiteSpace($TargetStatus)) {
    $target = $currentStatus
    $isTransitionCheck = $false
} else {
    $target = $TargetStatus.Trim()
    $isTransitionCheck = ($target -ne $currentStatus)
}

# Allowed transitions map
$allowedTransitions = @{
    "PROPOSED"               = @("PENDING_OWNER_APPROVAL", "REJECTED")
    "PENDING_OWNER_APPROVAL" = @("APPROVED", "REJECTED", "CHANGES_REQUESTED")
    "APPROVED"               = @("IN_PROGRESS")
    "IN_PROGRESS"            = @("IN_REVIEW")
    "IN_REVIEW"              = @("DONE", "CHANGES_REQUESTED")
    "CHANGES_REQUESTED"      = @("IN_PROGRESS")
    "REJECTED"               = @()
    "DONE"                   = @()
}

if ($isTransitionCheck) {
    if (-not $allowedTransitions.ContainsKey($currentStatus)) {
        Write-Error "Unknown current status '$currentStatus'"
        exit 1
    }
    
    $allowed = $allowedTransitions[$currentStatus]
    if ($allowed -notcontains $target) {
        Write-Error "INVALID TRANSITION: Cannot transition from '$currentStatus' to '$target'. Allowed transitions: $($allowed -join ', ')"
        exit 1
    }
}

# Approval verification for statuses that require prior approval (APPROVED, IN_PROGRESS, IN_REVIEW, DONE)
$approvalRequiredStatuses = @("APPROVED", "IN_PROGRESS", "IN_REVIEW", "DONE")

if ($approvalRequiredStatuses -contains $target) {
    try {
        $logJson = Get-Content $ApprovalLogPath -Raw | ConvertFrom-Json
    } catch {
        Write-Error "Failed to parse approval log JSON: $_"
        exit 1
    }

    # Find matching approval record for this task ID
    $matchingApprovals = $logJson | Where-Object { 
        $_.target_id -eq $taskId -and $_.decision_status -eq "APPROVED_BY_OWNER" 
    }

    if (-not $matchingApprovals -or $matchingApprovals.Count -eq 0) {
        Write-Error "APPROVAL VALIDATION FAILED: Target status '$target' requires owner approval for '$taskId', but no matching APPROVED_BY_OWNER record found in $ApprovalLogPath"
        exit 1
    }

    Write-Host "Found valid approval record: $($matchingApprovals[0].approval_id) for $taskId"
}

Write-Host "VALIDATION SUCCESSFUL: State transition / status '$target' is valid for $taskId"
exit 0
