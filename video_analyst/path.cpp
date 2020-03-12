
#include <iostream>
#include <Windows.h>
#include <string>
 
using namespace std;
 
int SharedDiskOperation(int cmd)
{
	HANDLE hChildStdinRd = NULL, hChildStdinWr = NULL, hChildStdoutWr = NULL, hChildStdoutRd = NULL;
	SECURITY_ATTRIBUTES saAttr;
	saAttr.nLength = sizeof(SECURITY_ATTRIBUTES);
	saAttr.bInheritHandle = TRUE;
	saAttr.lpSecurityDescriptor = NULL;
 
	if (!CreatePipe(&hChildStdoutRd, &hChildStdoutWr, &saAttr, 0))
	{
		cout << "Create stdout pipe failed when set shared disk online, error code:" << GetLastError() << endl;
		return 1;
	}
	SetHandleInformation(hChildStdoutRd, HANDLE_FLAG_INHERIT, 0);
 
	if (!CreatePipe(&hChildStdinRd, &hChildStdinWr, &saAttr, 0))
	{
		CloseHandle(hChildStdoutRd);
		CloseHandle(hChildStdoutWr);
		cout << "Create stdin pipe failed when set shared disk online, error code:" << GetLastError() << endl;
		return 2;
	}
	SetHandleInformation(hChildStdinWr, HANDLE_FLAG_INHERIT, 0);
 
	TCHAR szCmdline[] = TEXT("diskpart.exe");
	PROCESS_INFORMATION piProcInfo;
	STARTUPINFO siStartInfo;
	BOOL bFuncRetn = FALSE;
 
	ZeroMemory(&piProcInfo, sizeof(PROCESS_INFORMATION));
	ZeroMemory(&siStartInfo, sizeof(STARTUPINFO));
	siStartInfo.cb = sizeof(STARTUPINFO);
	siStartInfo.hStdError = hChildStdoutWr;
	siStartInfo.hStdOutput = hChildStdoutWr;       //控制台窗口
	siStartInfo.hStdInput = hChildStdinRd;         //键盘
	siStartInfo.dwFlags |= STARTF_USESTDHANDLES;
 
	bFuncRetn = CreateProcess(NULL, szCmdline, NULL, NULL, TRUE, 0, NULL, NULL, &siStartInfo, &piProcInfo);
 
	if (bFuncRetn == 0)
	{
		CloseHandle(hChildStdinRd);
		CloseHandle(hChildStdinWr);
		CloseHandle(hChildStdoutWr);
		CloseHandle(hChildStdoutRd);
		cout << "Create process failed when set shared disk online, error code" << GetLastError() << endl;
		return 3;
	}
	else
	{
		CloseHandle(piProcInfo.hProcess);
		CloseHandle(piProcInfo.hThread);
	}
 
	DWORD dwWritten;
	if (cmd == 1)//san policy = onlineall
	{
		WriteFile(hChildStdinWr, "san policy = onlineall", sizeof("san policy = onlineall"), &dwWritten, NULL);
	}
	else if (cmd == 2)//san policy = offlineshared
	{
		WriteFile(hChildStdinWr, "san policy = offlineshared", sizeof("san policy = offlineshared"), &dwWritten, NULL);
	}
	else if (cmd == 3)//san policy = offlineall
	{
		WriteFile(hChildStdinWr, "san policy = offlineall", sizeof("san policy = offlineall"), &dwWritten, NULL);
	}
	else
	{
		cout << "undefined operation! " << endl;
	}
 
	WriteFile(hChildStdinWr, "exit", sizeof("exit"), &dwWritten, NULL);
 
	if (hChildStdinRd != NULL)
	{
		CloseHandle(hChildStdinRd);
	}
	if (hChildStdinWr != NULL)
	{
		CloseHandle(hChildStdinWr);
	}
	if (hChildStdoutWr != NULL)
	{
		CloseHandle(hChildStdoutWr);
	}
	if (hChildStdoutRd != NULL)
	{
		CloseHandle(hChildStdoutRd);
	}
	 
	return 0;
}
 
int main()
{
	/*int num, retcode;
	cout << "Please input cmd: " << endl;
	cout << "1.全部联机 2.共享磁盘脱机 3.全部脱机" << endl;
	cin >> num;*/
	int retcode;
	retcode = SharedDiskOperation(1);
	if (retcode == 0)
		cout << "Successfully operate disk! " << endl;
	else
		cout << "Failed operate disk! " << endl;
	return 0;
}
