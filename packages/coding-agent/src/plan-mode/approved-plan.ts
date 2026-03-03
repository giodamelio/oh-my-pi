import * as fs from "node:fs/promises";
import { isEnoent } from "@oh-my-pi/pi-utils";
import { resolveLocalUrlToPath } from "../internal-urls";

interface RenameApprovedPlanFileOptions {
	planFilePath: string;
	finalPlanFilePath: string;
	getArtifactsDir: () => string | null;
	getSessionId: () => string | null;
}

function assertLocalUrl(path: string, label: "source" | "destination"): void {
	if (!path.startsWith("local://")) {
		throw new Error(`Approved plan ${label} path must use local:// (received ${path}).`);
	}
}

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.stat(filePath);
		return true;
	} catch (error) {
		if (isEnoent(error)) return false;
		throw error;
	}
}

export async function renameApprovedPlanFile(options: RenameApprovedPlanFileOptions): Promise<string> {
	const { planFilePath, finalPlanFilePath, getArtifactsDir, getSessionId } = options;
	assertLocalUrl(planFilePath, "source");
	assertLocalUrl(finalPlanFilePath, "destination");

	const resolveOptions = {
		getArtifactsDir: () => getArtifactsDir(),
		getSessionId: () => getSessionId(),
	};
	const resolvedSource = resolveLocalUrlToPath(planFilePath, resolveOptions);

	// Find a non-conflicting destination path
	let actualFinalPath = finalPlanFilePath;
	let resolvedDestination = resolveLocalUrlToPath(actualFinalPath, resolveOptions);

	if (resolvedSource === resolvedDestination) {
		return actualFinalPath;
	}

	let counter = 1;
	while (await fileExists(resolvedDestination)) {
		counter++;
		actualFinalPath = finalPlanFilePath.replace(/\.md$/, `-${counter}.md`);
		resolvedDestination = resolveLocalUrlToPath(actualFinalPath, resolveOptions);
	}

	try {
		await fs.rename(resolvedSource, resolvedDestination);
	} catch (error) {
		throw new Error(
			`Failed to rename approved plan from ${planFilePath} to ${actualFinalPath}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	return actualFinalPath;
}
