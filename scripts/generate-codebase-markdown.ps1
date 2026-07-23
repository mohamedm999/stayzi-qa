[CmdletBinding()]
param(
    [string]$OutputPath = (Join-Path $PSScriptRoot '..\CODEBASE.md')
)

$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$outputPathCandidate = if ([System.IO.Path]::IsPathRooted($OutputPath)) {
    $OutputPath
}
else {
    Join-Path $repositoryRoot $OutputPath
}
$resolvedOutputPath = [System.IO.Path]::GetFullPath($outputPathCandidate)

function Get-LanguageFromExtension {
    param([string]$Path)

    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        '.ts' { 'typescript' }
        '.json' { 'json' }
        '.ps1' { 'powershell' }
        '.yml' { 'yaml' }
        '.yaml' { 'yaml' }
        '.md' { 'markdown' }
        default { 'text' }
    }
}

function New-TreeNode {
    [PSCustomObject]@{
        Directories = [ordered]@{}
        Files       = [System.Collections.ArrayList]::new()
    }
}

function Get-DirectoryTree {
    param([string[]]$Files, [string]$RootName)

    $root = New-TreeNode
    foreach ($file in $Files) {
        $segments = $file -split '[\\/]'
        $current = $root
        for ($index = 0; $index -lt $segments.Count - 1; $index++) {
            $directory = $segments[$index]
            if (-not $current.Directories.Contains($directory)) {
                $current.Directories[$directory] = New-TreeNode
            }
            $current = $current.Directories[$directory]
        }
        [void]$current.Files.Add($segments[-1])
    }

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add("$RootName/")
    function Add-TreeLines {
        param($Node, [string]$Prefix)

        $entries = @(
            $Node.Directories.Keys | ForEach-Object { [PSCustomObject]@{ Name = $_; Node = $Node.Directories[$_]; IsDirectory = $true } }
        ) + @(
            $Node.Files | Sort-Object | ForEach-Object { [PSCustomObject]@{ Name = $_; Node = $null; IsDirectory = $false } }
        )

        for ($index = 0; $index -lt $entries.Count; $index++) {
            $entry = $entries[$index]
            $isLast = $index -eq $entries.Count - 1
            $branch = if ($isLast) { '\-- ' } else { '+-- ' }
            $suffix = if ($entry.IsDirectory) { '/' } else { '' }
            $lines.Add("$Prefix$branch$($entry.Name)$suffix")

            if ($entry.IsDirectory) {
                if ($isLast) {
                    $childPrefix = "$Prefix    "
                }
                else {
                    $childPrefix = "$Prefix|   "
                }
                Add-TreeLines -Node $entry.Node -Prefix $childPrefix
            }
        }
    }

    Add-TreeLines -Node $root -Prefix ''
    return $lines
}

Push-Location $repositoryRoot
try {
    $files = @(git ls-files -- ':!package-lock.json' ':!.env' ':!CODEBASE.md')
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to read the repository file list from Git.'
    }

    $scriptPath = 'scripts/generate-codebase-markdown.ps1'
    if ($files -notcontains $scriptPath) {
        $files += $scriptPath
    }

    $files = @($files | Where-Object {
        $_ -notmatch '^(node_modules|allure-results|reports|screenshots|test-results|\.git)/'
    } | Sort-Object)

    $tree = Get-DirectoryTree -Files $files -RootName (Split-Path -Leaf $repositoryRoot)
    $generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss UTC')

    $markdown = [System.Collections.Generic.List[string]]::new()
    $markdown.Add('# StayZi QA Codebase')
    $markdown.Add('')
    $markdown.Add("Generated on $generatedAt by `scripts/generate-codebase-markdown.ps1`.")
    $markdown.Add('')
    $markdown.Add('This document contains the tracked source, configuration, and test files. It intentionally excludes dependencies, generated test artifacts, Git metadata, the real `.env` file, and `package-lock.json`.')
    $markdown.Add('')
    $markdown.Add('## Directory structure')
    $markdown.Add('')
    $markdown.Add('```text')
    $markdown.AddRange([string[]]$tree)
    $markdown.Add('```')

    foreach ($file in $files) {
        $fullPath = Join-Path $repositoryRoot $file
        if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
            continue
        }

        $markdown.Add('')
        $markdown.Add("## ``$file``")
        $markdown.Add('')
        $markdown.Add("``````$(Get-LanguageFromExtension $file)")
        $markdown.Add((Get-Content -LiteralPath $fullPath -Raw).TrimEnd("`r", "`n"))
        $markdown.Add('``````')
    }

    $outputDirectory = Split-Path -Parent $resolvedOutputPath
    if (-not (Test-Path -LiteralPath $outputDirectory)) {
        New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    }

    [System.IO.File]::WriteAllText(
        $resolvedOutputPath,
        (($markdown -join [Environment]::NewLine) + [Environment]::NewLine),
        [System.Text.UTF8Encoding]::new($false)
    )

    Write-Output "Created $resolvedOutputPath"
}
finally {
    Pop-Location
}
