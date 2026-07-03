; Stingray NSIS Installer
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"

Name "Stingray Language v1.0.0"
OutFile "Stingray-Setup-v1.0.0.exe"
InstallDir "$PROGRAMFILES64\Stingray"
RequestExecutionLevel admin
ShowInstDetails show
SetCompressor lzma

!define MUI_ICON "Assets\logo.png"
!define MUI_UNICON "Assets\logo.png"
!define MUI_HEADERIMAGE
!define MUI_FINISHPAGE_NOAUTOCLOSE

!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_RUN "$INSTDIR\bin\stingray.exe.bat"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "Install Stingray"
  SetOutPath "$INSTDIR"
  
  ; Copy all files
  File /r "bin\*.*"
  File /r "src\*.*"
  File /r "dist\*.*"
  File /r "Assets\*.*"
  File /r "extension\*.*"
  File /r "examples\*.*"
  File /r "tests\*.*"
  File "package.json"
  File "stingray.json"
  
  ; Create Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\Stingray"
  CreateShortCut "$SMPROGRAMS\Stingray\Stingray.lnk" "$INSTDIR\bin\stingray.exe.bat"
  CreateShortCut "$SMPROGRAMS\Stingray\Stingray Dev.lnk" "$INSTDIR\bin\stingray.exe.bat" "dev"
  CreateShortCut "$SMPROGRAMS\Stingray\Stingray Build.lnk" "$INSTDIR\bin\stingray.exe.bat" "build"
  CreateShortCut "$SMPROGRAMS\Stingray\Uninstall.lnk" "$INSTDIR\uninstall.exe"
  
  ; Create Desktop shortcut
  WriteIniStr "$INSTDIR\desktop.ini" "Protocol" "ftype" "stingray"
  
  ; Register file association
  WriteRegStr HKCR ".stngr" "" "Stingray.Source"
  WriteRegStr HKCR "Stingray.Source" "" "Stingray Source File"
  WriteRegStr HKCR "Stingray.Source\DefaultIcon" "" "$INSTDIR\Assets\logo.png,0"
  WriteRegStr HKCR "Stingray.Source\shell\open\command" "" '"$INSTDIR\bin\stingray.exe.bat" "%1"'
  WriteRegStr HKCR "Stingray.Source\shell\compile\command" "" '"$INSTDIR\bin\stingray.exe.bat" compile "%1"'
  WriteRegStr HKCR "Stingray.Source\shell\dev\command" "" '"$INSTDIR\bin\stingray.exe.bat" dev "%1"'
  WriteRegStr HKCR "Stingray.Source\shell\build\command" "" '"$INSTDIR\bin\stingray.exe.bat" build "%1"'
  
  ; Add to PATH
  ReadRegStr $R0 HKCU "Environment" "Path"
  StrCmp $R0 "" +2
  WriteRegStr HKCU "Environment" "Path" "$R0;$INSTDIR\bin"
  WriteRegStr HKCU "Environment" "STINGRAY_HOME" "$INSTDIR"
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
  ; Registry uninstall info
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Stingray" "DisplayName" "Stingray Language"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Stingray" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Stingray" "DisplayIcon" "$INSTDIR\Assets\logo.png"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Stingray" "DisplayVersion" "1.0.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Stingray" "Publisher" "Stingray Team"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Stingray" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Stingray" "NoRepair" 1
SectionEnd

Section "Uninstall"
  ; Delete files
  RMDir /r "$INSTDIR\bin"
  RMDir /r "$INSTDIR\src"
  RMDir /r "$INSTDIR\dist"
  RMDir /r "$INSTDIR\extension"
  RMDir /r "$INSTDIR\examples"
  RMDir /r "$INSTDIR\tests"
  RMDir /r "$INSTDIR\Assets"
  
  ; Delete shortcuts
  Delete "$SMPROGRAMS\Stingray\*.lnk"
  RMDir "$SMPROGRAMS\Stingray"
  
  ; Remove file associations
  DeleteRegKey HKCR ".stngr"
  DeleteRegKey HKCR "Stingray.Source"
  
  ; Remove from PATH (basic removal)
  DeleteRegValue HKCU "Environment" "STINGRAY_HOME"
  
  ; Remove uninstall registry
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Stingray"
  
  RMDir "$INSTDIR"
SectionEnd
