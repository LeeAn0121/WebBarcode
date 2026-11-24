const reservedRootNames = new Set(["전체", "기본폴더"]);

export function normalizeFolderPath(raw: string): string {
  const segments = raw.split("/").map((segment) => segment.trim());
  if (segments.some((segment) => !segment)) {
    throw new Error(
      "폴더 이름을 입력하세요. 경로에 빈 폴더 이름을 사용할 수 없습니다.",
    );
  }
  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error("폴더 이름으로 . 또는 ..을 사용할 수 없습니다.");
  }
  const path = segments.join("/");
  if (segments[0] === "전체" || reservedRootNames.has(path)) {
    throw new Error(
      "전체와 기본폴더는 예약된 이름입니다. 다른 이름을 입력하세요.",
    );
  }
  return path;
}

export function collectFolderPaths(paths: string[]): string[] {
  const collected = new Set<string>();
  for (const path of paths) {
    const segments = path.split("/").map((segment) => segment.trim());
    if (segments.some((segment) => !segment)) continue;
    for (let length = 1; length <= segments.length; length += 1) {
      collected.add(segments.slice(0, length).join("/"));
    }
  }
  return [...collected];
}

export function renameFolderPath(
  path: string,
  oldPath: string,
  newPath: string,
): string {
  return path === oldPath || path.startsWith(`${oldPath}/`)
    ? newPath + path.slice(oldPath.length)
    : path;
}

export function planFolderRename(
  oldPath: string,
  rawNewName: string,
  existingPaths: string[],
): { newPath: string; mapping: Map<string, string> } {
  const normalizedOldPath = normalizeFolderPath(oldPath);
  const newName = rawNewName.trim();
  if (!newName || newName.includes("/")) {
    throw new Error(
      "새 폴더 이름을 입력하세요. 이름에 /를 사용할 수 없습니다.",
    );
  }
  const lastSlash = normalizedOldPath.lastIndexOf("/");
  const parentPath =
    lastSlash < 0 ? "" : normalizedOldPath.slice(0, lastSlash + 1);
  const newPath = normalizeFolderPath(parentPath + newName);
  const paths = collectFolderPaths([...existingPaths, normalizedOldPath]);
  const sourcePaths = paths.filter(
    (path) =>
      path === normalizedOldPath || path.startsWith(`${normalizedOldPath}/`),
  );
  const mapping = new Map(
    sourcePaths.map((path) => [
      path,
      renameFolderPath(path, normalizedOldPath, newPath),
    ]),
  );
  if (newPath !== normalizedOldPath) {
    const source = new Set(sourcePaths);
    if (
      paths.some(
        (path) =>
          !source.has(path) &&
          (path === newPath || path.startsWith(`${newPath}/`)),
      )
    ) {
      throw new Error(
        "같은 이름의 폴더가 이미 있습니다. 다른 이름을 입력하세요.",
      );
    }
  }
  return { newPath, mapping };
}
