import { r as __name } from "./chunk-Q72B4Q5Z-izl5Qmnx.mjs";
import fs2 from "node:fs";
import os from "node:os";
import path2__default from "node:path";
import childProcess, { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Buffer } from "node:buffer";
import { fileURLToPath } from "node:url";
import fs, { constants as constants$1 } from "node:fs/promises";
import process from "node:process";

//#region ../workers-utils/dist/open-PBXRGS4R.mjs
var isDockerCached;
function hasDockerEnv() {
	try {
		fs2.statSync("/.dockerenv");
		return true;
	} catch {
		return false;
	}
}
__name(hasDockerEnv, "hasDockerEnv");
function hasDockerCGroup() {
	try {
		return fs2.readFileSync("/proc/self/cgroup", "utf8").includes("docker");
	} catch {
		return false;
	}
}
__name(hasDockerCGroup, "hasDockerCGroup");
function isDocker() {
	if (isDockerCached === void 0) isDockerCached = hasDockerEnv() || hasDockerCGroup();
	return isDockerCached;
}
__name(isDocker, "isDocker");
var cachedResult;
var hasContainerEnv = /* @__PURE__ */ __name(() => {
	try {
		fs2.statSync("/run/.containerenv");
		return true;
	} catch {
		return false;
	}
}, "hasContainerEnv");
function isInsideContainer() {
	if (cachedResult === void 0) cachedResult = hasContainerEnv() || isDocker();
	return cachedResult;
}
__name(isInsideContainer, "isInsideContainer");
var isWsl = /* @__PURE__ */ __name(() => {
	if (process.platform !== "linux") return false;
	if (os.release().toLowerCase().includes("microsoft")) {
		if (isInsideContainer()) return false;
		return true;
	}
	try {
		return fs2.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft") ? !isInsideContainer() : false;
	} catch {
		return false;
	}
}, "isWsl");
var is_wsl_default = process.env.__IS_WSL_TEST__ ? isWsl : isWsl();
var execFile$1 = promisify(childProcess.execFile);
var powerShellPath = /* @__PURE__ */ __name(() => `${process.env.SYSTEMROOT || process.env.windir || String.raw`C:\Windows`}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`, "powerShellPath");
var executePowerShell = /* @__PURE__ */ __name(async (command, options = {}) => {
	const { powerShellPath: psPath,...execFileOptions } = options;
	const encodedCommand = executePowerShell.encodeCommand(command);
	return execFile$1(psPath ?? powerShellPath(), [...executePowerShell.argumentsPrefix, encodedCommand], {
		encoding: "utf8",
		...execFileOptions
	});
}, "executePowerShell");
executePowerShell.argumentsPrefix = [
	"-NoProfile",
	"-NonInteractive",
	"-ExecutionPolicy",
	"Bypass",
	"-EncodedCommand"
];
executePowerShell.encodeCommand = (command) => Buffer.from(command, "utf16le").toString("base64");
executePowerShell.escapeArgument = (value) => `'${String(value).replaceAll("'", "''")}'`;
function parseMountPointFromConfig(content) {
	for (const line of content.split("\n")) {
		if (/^\s*#/.test(line)) continue;
		const match = /^\s*root\s*=\s*(?<mountPoint>"[^"]*"|'[^']*'|[^#]*)/.exec(line);
		if (!match) continue;
		return match.groups.mountPoint.trim().replaceAll(/^["']|["']$/g, "");
	}
}
__name(parseMountPointFromConfig, "parseMountPointFromConfig");
var execFile2 = promisify(childProcess.execFile);
var wslDrivesMountPoint = /* @__PURE__ */ (() => {
	const defaultMountPoint = "/mnt/";
	let mountPoint;
	return async function() {
		if (mountPoint) return mountPoint;
		const configFilePath = "/etc/wsl.conf";
		let isConfigFileExists = false;
		try {
			await fs.access(configFilePath, constants$1.F_OK);
			isConfigFileExists = true;
		} catch {}
		if (!isConfigFileExists) return defaultMountPoint;
		const parsedMountPoint = parseMountPointFromConfig(await fs.readFile(configFilePath, { encoding: "utf8" }));
		if (parsedMountPoint === void 0) return defaultMountPoint;
		mountPoint = parsedMountPoint;
		mountPoint = mountPoint.endsWith("/") ? mountPoint : `${mountPoint}/`;
		return mountPoint;
	};
})();
var powerShellPath2 = is_wsl_default ? /* @__PURE__ */ __name(async () => {
	return `${await wslDrivesMountPoint()}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`;
}, "powerShellPathFromWsl") : powerShellPath;
var canAccessPowerShellPromise;
var canAccessPowerShell = /* @__PURE__ */ __name(async () => {
	canAccessPowerShellPromise ??= (async () => {
		try {
			const psPath = await powerShellPath2();
			await fs.access(psPath, constants$1.X_OK);
			return true;
		} catch {
			return false;
		}
	})();
	return canAccessPowerShellPromise;
}, "canAccessPowerShell");
var wslDefaultBrowser = /* @__PURE__ */ __name(async () => {
	const psPath = await powerShellPath2();
	const { stdout: stdout$1 } = await executePowerShell(String.raw`(Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice").ProgId`, { powerShellPath: psPath });
	return stdout$1.trim();
}, "wslDefaultBrowser");
var convertWslPathToWindows = /* @__PURE__ */ __name(async (path2) => {
	if (/^[a-z]+:\/\//i.test(path2)) return path2;
	try {
		const { stdout: stdout$1 } = await execFile2("wslpath", ["-aw", path2], { encoding: "utf8" });
		return stdout$1.trim();
	} catch {
		return path2;
	}
}, "convertWslPathToWindows");
function defineLazyProperty(object, propertyName, valueGetter) {
	const define = /* @__PURE__ */ __name((value) => Object.defineProperty(object, propertyName, {
		value,
		enumerable: true,
		writable: true
	}), "define");
	Object.defineProperty(object, propertyName, {
		configurable: true,
		enumerable: true,
		get() {
			const result = valueGetter();
			define(result);
			return result;
		},
		set(value) {
			define(value);
		}
	});
	return object;
}
__name(defineLazyProperty, "defineLazyProperty");
var execFileAsync = promisify(execFile);
async function defaultBrowserId() {
	if (process.platform !== "darwin") throw new Error("macOS only");
	const { stdout: stdout$1 } = await execFileAsync("defaults", [
		"read",
		"com.apple.LaunchServices/com.apple.launchservices.secure",
		"LSHandlers"
	]);
	const browserId = /LSHandlerRoleAll = "(?!-)(?<id>[^"]+?)";\s+?LSHandlerURLScheme = (?:http|https);/.exec(stdout$1)?.groups.id ?? "com.apple.Safari";
	if (browserId === "com.apple.safari") return "com.apple.Safari";
	return browserId;
}
__name(defaultBrowserId, "defaultBrowserId");
var execFileAsync2 = promisify(execFile);
async function runAppleScript(script, { humanReadableOutput = true, signal } = {}) {
	if (process.platform !== "darwin") throw new Error("macOS only");
	const outputArguments = humanReadableOutput ? [] : ["-ss"];
	const execOptions = {};
	if (signal) execOptions.signal = signal;
	const { stdout: stdout$1 } = await execFileAsync2("osascript", [
		"-e",
		script,
		outputArguments
	], execOptions);
	return stdout$1.trim();
}
__name(runAppleScript, "runAppleScript");
async function bundleName(bundleId) {
	return runAppleScript(`tell application "Finder" to set app_path to application file id "${bundleId}" as string
tell application "System Events" to get value of property list item "CFBundleName" of property list file (app_path & ":Contents:Info.plist")`);
}
__name(bundleName, "bundleName");
var execFileAsync3 = promisify(execFile);
var windowsBrowserProgIds = {
	MSEdgeHTM: {
		name: "Edge",
		id: "com.microsoft.edge"
	},
	MSEdgeBHTML: {
		name: "Edge Beta",
		id: "com.microsoft.edge.beta"
	},
	MSEdgeDHTML: {
		name: "Edge Dev",
		id: "com.microsoft.edge.dev"
	},
	AppXq0fevzme2pys62n3e0fbqa7peapykr8v: {
		name: "Edge",
		id: "com.microsoft.edge.old"
	},
	ChromeHTML: {
		name: "Chrome",
		id: "com.google.chrome"
	},
	ChromeBHTML: {
		name: "Chrome Beta",
		id: "com.google.chrome.beta"
	},
	ChromeDHTML: {
		name: "Chrome Dev",
		id: "com.google.chrome.dev"
	},
	ChromiumHTM: {
		name: "Chromium",
		id: "org.chromium.Chromium"
	},
	BraveHTML: {
		name: "Brave",
		id: "com.brave.Browser"
	},
	BraveBHTML: {
		name: "Brave Beta",
		id: "com.brave.Browser.beta"
	},
	BraveDHTML: {
		name: "Brave Dev",
		id: "com.brave.Browser.dev"
	},
	BraveSSHTM: {
		name: "Brave Nightly",
		id: "com.brave.Browser.nightly"
	},
	FirefoxURL: {
		name: "Firefox",
		id: "org.mozilla.firefox"
	},
	OperaStable: {
		name: "Opera",
		id: "com.operasoftware.Opera"
	},
	VivaldiHTM: {
		name: "Vivaldi",
		id: "com.vivaldi.Vivaldi"
	},
	"IE.HTTP": {
		name: "Internet Explorer",
		id: "com.microsoft.ie"
	}
};
var _windowsBrowserProgIdMap = new Map(Object.entries(windowsBrowserProgIds));
var UnknownBrowserError = class extends Error {
	static {
		__name(this, "UnknownBrowserError");
	}
};
async function defaultBrowser(_execFileAsync = execFileAsync3) {
	const { stdout: stdout$1 } = await _execFileAsync("reg", [
		"QUERY",
		" HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice",
		"/v",
		"ProgId"
	]);
	const match = /ProgId\s*REG_SZ\s*(?<id>\S+)/.exec(stdout$1);
	if (!match) throw new UnknownBrowserError(`Cannot find Windows browser in stdout: ${JSON.stringify(stdout$1)}`);
	const { id } = match.groups;
	const browser = windowsBrowserProgIds[id];
	if (!browser) throw new UnknownBrowserError(`Unknown browser ID: ${id}`);
	return browser;
}
__name(defaultBrowser, "defaultBrowser");
var execFileAsync4 = promisify(execFile);
var titleize = /* @__PURE__ */ __name((string) => string.toLowerCase().replaceAll(/(?:^|\s|-)\S/g, (x) => x.toUpperCase()), "titleize");
async function defaultBrowser2() {
	if (process.platform === "darwin") {
		const id = await defaultBrowserId();
		return {
			name: await bundleName(id),
			id
		};
	}
	if (process.platform === "linux") {
		const { stdout: stdout$1 } = await execFileAsync4("xdg-mime", [
			"query",
			"default",
			"x-scheme-handler/http"
		]);
		const id = stdout$1.trim();
		return {
			name: titleize(id.replace(/.desktop$/, "").replace("-", " ")),
			id
		};
	}
	if (process.platform === "win32") return defaultBrowser();
	throw new Error("Only macOS, Linux, and Windows are supported");
}
__name(defaultBrowser2, "defaultBrowser");
var is_in_ssh_default = Boolean(process.env.SSH_CONNECTION || process.env.SSH_CLIENT || process.env.SSH_TTY);
var fallbackAttemptSymbol = Symbol("fallbackAttempt");
var __dirname$1 = import.meta.url ? path2__default.dirname(fileURLToPath(import.meta.url)) : "";
var localXdgOpenPath = path2__default.join(__dirname$1, "xdg-open");
var { platform, arch: arch$1 } = process;
var tryEachApp = /* @__PURE__ */ __name(async (apps2, opener) => {
	if (apps2.length === 0) return;
	const errors = [];
	for (const app of apps2) try {
		return await opener(app);
	} catch (error) {
		errors.push(error);
	}
	throw new AggregateError(errors, "Failed to open in all supported apps");
}, "tryEachApp");
var baseOpen = /* @__PURE__ */ __name(async (options) => {
	options = {
		wait: false,
		background: false,
		newInstance: false,
		allowNonzeroExitCode: false,
		...options
	};
	const isFallbackAttempt = options[fallbackAttemptSymbol] === true;
	delete options[fallbackAttemptSymbol];
	if (Array.isArray(options.app)) return tryEachApp(options.app, (singleApp) => baseOpen({
		...options,
		app: singleApp,
		[fallbackAttemptSymbol]: true
	}));
	let { name: app, arguments: appArguments = [] } = options.app ?? {};
	appArguments = [...appArguments];
	if (Array.isArray(app)) return tryEachApp(app, (appName) => baseOpen({
		...options,
		app: {
			name: appName,
			arguments: appArguments
		},
		[fallbackAttemptSymbol]: true
	}));
	if (app === "browser" || app === "browserPrivate") {
		const ids = {
			"com.google.chrome": "chrome",
			"google-chrome.desktop": "chrome",
			"com.brave.browser": "brave",
			"org.mozilla.firefox": "firefox",
			"firefox.desktop": "firefox",
			"com.microsoft.msedge": "edge",
			"com.microsoft.edge": "edge",
			"com.microsoft.edgemac": "edge",
			"microsoft-edge.desktop": "edge",
			"com.apple.safari": "safari"
		};
		const flags = {
			chrome: "--incognito",
			brave: "--incognito",
			firefox: "--private-window",
			edge: "--inPrivate"
		};
		let browser;
		if (is_wsl_default) {
			const progId = await wslDefaultBrowser();
			browser = _windowsBrowserProgIdMap.get(progId) ?? {};
		} else browser = await defaultBrowser2();
		if (browser.id in ids) {
			const browserName = ids[browser.id.toLowerCase()];
			if (app === "browserPrivate") {
				if (browserName === "safari") throw new Error("Safari doesn't support opening in private mode via command line");
				appArguments.push(flags[browserName]);
			}
			return baseOpen({
				...options,
				app: {
					name: apps[browserName],
					arguments: appArguments
				}
			});
		}
		throw new Error(`${browser.name} is not supported as a default browser`);
	}
	let command;
	const cliArguments = [];
	const childProcessOptions = {};
	let shouldUseWindowsInWsl = false;
	if (is_wsl_default && !isInsideContainer() && !is_in_ssh_default && !app) shouldUseWindowsInWsl = await canAccessPowerShell();
	if (platform === "darwin") {
		command = "open";
		if (options.wait) cliArguments.push("--wait-apps");
		if (options.background) cliArguments.push("--background");
		if (options.newInstance) cliArguments.push("--new");
		if (app) cliArguments.push("-a", app);
	} else if (platform === "win32" || shouldUseWindowsInWsl) {
		command = await powerShellPath2();
		cliArguments.push(...executePowerShell.argumentsPrefix);
		if (!is_wsl_default) childProcessOptions.windowsVerbatimArguments = true;
		if (is_wsl_default && options.target) options.target = await convertWslPathToWindows(options.target);
		const encodedArguments = ["$ProgressPreference = 'SilentlyContinue';", "Start"];
		if (options.wait) encodedArguments.push("-Wait");
		if (app) {
			encodedArguments.push(executePowerShell.escapeArgument(app));
			if (options.target) appArguments.push(options.target);
		} else if (options.target) encodedArguments.push(executePowerShell.escapeArgument(options.target));
		if (appArguments.length > 0) {
			appArguments = appArguments.map((argument) => executePowerShell.escapeArgument(argument));
			encodedArguments.push("-ArgumentList", appArguments.join(","));
		}
		options.target = executePowerShell.encodeCommand(encodedArguments.join(" "));
		if (!options.wait) childProcessOptions.stdio = "ignore";
	} else {
		if (app) command = app;
		else {
			const isBundled = !__dirname$1 || __dirname$1 === "/";
			let exeLocalXdgOpen = false;
			try {
				await fs.access(localXdgOpenPath, constants$1.X_OK);
				exeLocalXdgOpen = true;
			} catch {}
			command = process.versions.electron ?? (platform === "android" || isBundled || !exeLocalXdgOpen) ? "xdg-open" : localXdgOpenPath;
		}
		if (appArguments.length > 0) cliArguments.push(...appArguments);
		if (!options.wait) {
			childProcessOptions.stdio = "ignore";
			childProcessOptions.detached = true;
		}
	}
	if (platform === "darwin" && appArguments.length > 0) cliArguments.push("--args", ...appArguments);
	if (options.target) cliArguments.push(options.target);
	const subprocess = childProcess.spawn(command, cliArguments, childProcessOptions);
	if (options.wait) return new Promise((resolve$1, reject) => {
		subprocess.once("error", reject);
		subprocess.once("close", (exitCode) => {
			if (!options.allowNonzeroExitCode && exitCode !== 0) {
				reject(/* @__PURE__ */ new Error(`Exited with code ${exitCode}`));
				return;
			}
			resolve$1(subprocess);
		});
	});
	if (isFallbackAttempt) return new Promise((resolve$1, reject) => {
		subprocess.once("error", reject);
		subprocess.once("spawn", () => {
			subprocess.once("close", (exitCode) => {
				subprocess.off("error", reject);
				if (exitCode !== 0) {
					reject(/* @__PURE__ */ new Error(`Exited with code ${exitCode}`));
					return;
				}
				subprocess.unref();
				resolve$1(subprocess);
			});
		});
	});
	subprocess.unref();
	return new Promise((resolve$1, reject) => {
		subprocess.once("error", reject);
		subprocess.once("spawn", () => {
			subprocess.off("error", reject);
			resolve$1(subprocess);
		});
	});
}, "baseOpen");
var open = /* @__PURE__ */ __name((target, options) => {
	if (typeof target !== "string") throw new TypeError("Expected a `target`");
	return baseOpen({
		...options,
		target
	});
}, "open");
function detectArchBinary(binary) {
	if (typeof binary === "string" || Array.isArray(binary)) return binary;
	const { [arch$1]: archBinary } = binary;
	if (!archBinary) throw new Error(`${arch$1} is not supported`);
	return archBinary;
}
__name(detectArchBinary, "detectArchBinary");
function detectPlatformBinary({ [platform]: platformBinary }, { wsl } = {}) {
	if (wsl && is_wsl_default) return detectArchBinary(wsl);
	if (!platformBinary) throw new Error(`${platform} is not supported`);
	return detectArchBinary(platformBinary);
}
__name(detectPlatformBinary, "detectPlatformBinary");
var apps = {
	browser: "browser",
	browserPrivate: "browserPrivate"
};
defineLazyProperty(apps, "chrome", () => detectPlatformBinary({
	darwin: "google chrome",
	win32: "chrome",
	linux: [
		"google-chrome",
		"google-chrome-stable",
		"chromium",
		"chromium-browser"
	]
}, { wsl: {
	ia32: "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",
	x64: ["/mnt/c/Program Files/Google/Chrome/Application/chrome.exe", "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"]
} }));
defineLazyProperty(apps, "brave", () => detectPlatformBinary({
	darwin: "brave browser",
	win32: "brave",
	linux: ["brave-browser", "brave"]
}, { wsl: {
	ia32: "/mnt/c/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe",
	x64: ["/mnt/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe", "/mnt/c/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe"]
} }));
defineLazyProperty(apps, "firefox", () => detectPlatformBinary({
	darwin: "firefox",
	win32: String.raw`C:\Program Files\Mozilla Firefox\firefox.exe`,
	linux: "firefox"
}, { wsl: "/mnt/c/Program Files/Mozilla Firefox/firefox.exe" }));
defineLazyProperty(apps, "edge", () => detectPlatformBinary({
	darwin: "microsoft edge",
	win32: "msedge",
	linux: ["microsoft-edge", "microsoft-edge-dev"]
}, { wsl: "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" }));
defineLazyProperty(apps, "safari", () => detectPlatformBinary({ darwin: "Safari" }));
var open_default = open;

//#endregion
export { open_default as default };
//# sourceMappingURL=open-PBXRGS4R-rCTko7Ic.mjs.map