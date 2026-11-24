import test from "node:test";
import assert from "node:assert/strict";
import {
  collectFolderPaths,
  normalizeFolderPath,
  planFolderRename,
  renameFolderPath,
} from "../src/folderOperations.ts";

test("nested paths are trimmed and implicit ancestors retain first-seen order", () => {
  assert.equal(
    normalizeFolderPath(" 작업 / 자료 / 새 폴더 "),
    "작업/자료/새 폴더",
  );
  assert.deepEqual(
    collectFolderPaths([
      "작업/자료/사진",
      "보관/문서",
      "작업/자료",
      "기본폴더",
    ]),
    ["작업", "작업/자료", "작업/자료/사진", "보관", "보관/문서", "기본폴더"],
  );
});

test("invalid path segments and reserved root names are rejected", () => {
  for (const name of [
    "",
    "  ",
    "/자료",
    "자료/",
    "자료//사진",
    "자료/ /사진",
    ".",
    "자료/..",
    "전체",
    "전체/자료",
    " 전체 / 자료 ",
    " 기본폴더 ",
  ]) {
    assert.throws(() => normalizeFolderPath(name), Error, name);
  }
  assert.equal(normalizeFolderPath("작업/전체"), "작업/전체");
  assert.equal(normalizeFolderPath("기본폴더/자료"), "기본폴더/자료");
});

test("renaming a nested parent includes implicit folders and descendants", () => {
  const paths = ["업무/현장/사진/원본", "업무/현장/메모", "업무/현장기록"];
  const before = [...paths];
  const plan = planFolderRename("업무/현장", " 보관 ", paths);
  assert.equal(plan.newPath, "업무/보관");
  assert.deepEqual(
    [...plan.mapping],
    [
      ["업무/현장", "업무/보관"],
      ["업무/현장/사진", "업무/보관/사진"],
      ["업무/현장/사진/원본", "업무/보관/사진/원본"],
      ["업무/현장/메모", "업무/보관/메모"],
    ],
  );
  assert.deepEqual(paths, before);
});

test("renaming respects folder boundaries rather than similar prefixes", () => {
  assert.equal(
    renameFolderPath("현장기록/사진", "현장", "보관"),
    "현장기록/사진",
  );
  assert.equal(renameFolderPath("현장/사진", "현장", "보관"), "보관/사진");
  assert.equal(renameFolderPath("현장", "현장", "보관"), "보관");
});

test("new names must be valid leaf names and root reserved names are protected", () => {
  for (const name of ["", " ", ".", "..", "다른/폴더", "전체", "기본폴더"]) {
    assert.throws(() => planFolderRename("작업", name, ["작업"]), Error, name);
  }
  assert.equal(
    planFolderRename("작업/기록", "전체", ["작업/기록"]).newPath,
    "작업/전체",
  );
});

test("renaming cannot merge into existing folders or their implicit ancestors", () => {
  assert.throws(
    () => planFolderRename("현장", "보관", ["현장", "보관"]),
    /이미/,
  );
  assert.throws(
    () => planFolderRename("현장", "보관", ["현장/사진", "보관/문서"]),
    /이미/,
  );
  assert.throws(
    () =>
      planFolderRename("업무/현장", "보관", [
        "업무/현장/사진",
        "업무/보관/사진",
      ]),
    /이미/,
  );
  assert.equal(
    planFolderRename("현장", "보관", ["현장", "보관함"]).newPath,
    "보관",
  );
});

test("an unchanged leaf name yields an identity plan", () => {
  const plan = planFolderRename("업무/현장", " 현장 ", ["업무/현장/사진"]);
  assert.equal(plan.newPath, "업무/현장");
  assert.deepEqual(
    [...plan.mapping],
    [
      ["업무/현장", "업무/현장"],
      ["업무/현장/사진", "업무/현장/사진"],
    ],
  );
});
