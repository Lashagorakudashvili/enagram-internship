"use client";

import Image from "next/image";
import Link from 'next/link';
import React, { useEffect, useRef, useState, useMemo } from "react";



// Escape HTML
const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Split text into words and spaces
const splitWords = (text: string) => text.match(/\S+|\s+/g) || [];

// Compare words: fuzzy matching
const wordsAreSimilar = (a: string, b: string) => {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  if (lowerA === lowerB) return true;

  let matches = 0;
  const minLen = Math.min(lowerA.length, lowerB.length);
  for (let i = 0; i < minLen; i++) if (lowerA[i] === lowerB[i]) matches++;
  return matches / Math.max(lowerA.length, lowerB.length) > 0.6;
};

// Letter-level diff
const diffLetters = (oldWord: string, newWord: string) => {
  const n = oldWord.length, m = newWord.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        oldWord[i].toLowerCase() === newWord[j].toLowerCase()
          ? 1 + dp[i + 1][j + 1]
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let i = 0, j = 0;
  const oldResult: string[] = [], newResult: string[] = [];

  while (i < n || j < m) {
    if (i < n && j < m && oldWord[i].toLowerCase() === newWord[j].toLowerCase()) {
      if (oldWord[i] === newWord[j]) {
        oldResult.push(escapeHtml(oldWord[i]));
        newResult.push(escapeHtml(newWord[j]));
      } else {
        oldResult.push(`<span class="text-red-500">${escapeHtml(oldWord[i])}</span>`);
        newResult.push(`<span class="text-green-500">${escapeHtml(newWord[j])}</span>`);
      }
      i++; j++;
    } else if (j < m && (i === n || dp[i][j + 1] >= dp[i + 1][j])) {
      newResult.push(`<span class="text-green-500">${escapeHtml(newWord[j])}</span>`);
      j++;
    } else if (i < n && (j === m || dp[i][j + 1] < dp[i + 1][j])) {
      oldResult.push(`<span class="text-red-500">${escapeHtml(oldWord[i])}</span>`);
      i++;
    }
  }

  return [oldResult.join(""), newResult.join("")];
};

// Word-level diff
const lcsWordDiff = (oldWords: string[], newWords: string[]) => {
  const n = oldWords.length, m = newWords.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  // Build LCS table
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = wordsAreSimilar(oldWords[i], newWords[j])
        ? 1 + dp[i + 1][j + 1]
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let i = 0, j = 0;
  const oldResult: string[] = [], newResult: string[] = [];

  while (i < n || j < m) {
    if (i < n && j < m && wordsAreSimilar(oldWords[i], newWords[j])) {
      if (oldWords[i] === newWords[j]) {
        oldResult.push(escapeHtml(oldWords[i]));
        newResult.push(escapeHtml(newWords[j]));
      } else {
        const [o, nn] = diffLetters(oldWords[i], newWords[j]);
        oldResult.push(o);
        newResult.push(nn);
      }
      i++; j++;
    } else if (j < m && (i === n || dp[i][j + 1] >= dp[i + 1][j])) {
      newResult.push(`<span class="text-green-500">${escapeHtml(newWords[j])}</span>`);
      j++;
    } else if (i < n && (j === m || dp[i][j + 1] < dp[i + 1][j])) {
      oldResult.push(`<span class="text-red-500">${escapeHtml(oldWords[i])}</span>`);
      i++;
    }
  }

  return [oldResult.join(""), newResult.join("")];
};

const TextComparator: React.FC = () => {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [comparedOld, setComparedOld] = useState("");
  const [comparedNew, setComparedNew] = useState("");
  const [isCompared, setIsCompared] = useState(false);

  const handleCompare = () => {
    const [oldHtml, newHtml] = lcsWordDiff(splitWords(oldText), splitWords(newText));
    setComparedOld(oldHtml.replace(/\n/g, "<br>"));
    setComparedNew(newHtml.replace(/\n/g, "<br>"));
    setIsCompared(true);
  };

  const handleReset = () => setIsCompared(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl">
        {isCompared ? (
          <div
            className="flex-1 min-h-[250px] bg-gray-50 border border-gray-300 rounded-md p-4 text-black overflow-y-auto whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: comparedOld }}
          />
        ) : (
          <textarea
            value={oldText}
            onChange={(e) => setOldText(e.target.value)}
            placeholder="ძველი ტექსტი..."
            className="flex-1 min-h-[250px] bg-gray-50 border border-gray-300 rounded-md p-4 text-black resize-none whitespace-pre-wrap break-words"
          />
        )}

        {isCompared ? (
          <div
            className="flex-1 min-h-[250px] bg-gray-50 border border-gray-300 rounded-md p-4 text-black overflow-y-auto whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: comparedNew }}
          />
        ) : (
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="ახალი ტექსტი..."
            className="flex-1 min-h-[250px] bg-gray-50 border border-gray-300 rounded-md p-4 text-black resize-none whitespace-pre-wrap break-words"
          />
        )}
      </div>

      <div className="mt-6 flex gap-4">
        {!isCompared ? (
          <button
            onClick={handleCompare}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            შედარება
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
          >
            ახალი შედარება
          </button>
        )}
      </div>
    </div>
  );
};

export default TextComparator;