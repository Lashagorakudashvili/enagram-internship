"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState, useMemo } from "react";



/* LOGIC */
  // Escape HTML
  const escapeHtml = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Escape HTML


  // Render spaces as tall blocks
  const renderSpaceBlocks = (spaces: string, color: "red" | "green") => {
    return spaces
      .split("")
      .map(
        () =>
          `<span style="display:inline-block;width:0.6em;height:1em;background-color:${
            color === "red" ? "#fb2c36" : "#22c55e"
          };margin:0 1px;"></span>`
      )
      .join("");
  };
  // Render spaces as tall blocks


  // Render only spaces after the first one as blocks (for middle-of-word cases)
  const renderExtraSpaces = (spaces: string, color: "red" | "green") => {
    if (spaces.length <= 1) return escapeHtml(spaces);
    return (
      escapeHtml(spaces[0]) +
      spaces
        .slice(1)
        .split("")
        .map(
          () =>
            `<span style="display:inline-block;width:0.6em;height:1em;background-color:${
              color === "red" ? "#fb2c36" : "#22c55e"
            };margin:0 1px;"></span>`
        )
        .join("")
    );
  };
  // Render only spaces after the first one as blocks (for middle-of-word cases)


  // Split text into words and spaces
  const splitWords = (text: string) => {
    const matches = text.match(/\s+|\S+/g) || [];
    return matches.length ? matches : [text]; // if empty, return the text itself
  };
  // Split text into words and spaces


  // to treat pure spaces separately
  const wordsAreSimilar = (a: string, b: string) => {
    if (/^\s+$/.test(a) && /^\s+$/.test(b)) return true; // spaces match exactly
    const lowerA = a.trim().toLowerCase();
    const lowerB = b.trim().toLowerCase();
    if (!lowerA && !lowerB) return true;
    if (lowerA === lowerB) return true;

    let matches = 0;
    const minLen = Math.min(lowerA.length, lowerB.length);
    for (let i = 0; i < minLen; i++) if (lowerA[i] === lowerB[i]) matches++;
    return matches / Math.max(lowerA.length, lowerB.length) > 0.6;
  };
  // to treat pure spaces separately


  // if a space should be highlighted fully
  const isHighlightableSpace = (token: string, index: number, arr: string[]) => {
    if (!/^\s+$/.test(token)) return false; // not spaces
    
    // middle-of-word spaces handled separately
    if (token.length >= 2 && /\S/.test(arr[index - 1] || "") && /\S/.test(arr[index + 1] || "")) {
    // middle-of-word spaces handled separately
      return false;
    }

    if (token.length >= 2) return true; // double or more spaces (non-middle)
    if (index === 0 || index === arr.length - 1) return true; // leading/trailing
    const prev = arr[index - 1] || "";
    const next = arr[index + 1] || "";
    if (/^\s*$/.test(prev) || /^\s*$/.test(next)) return true; // isolated
    return false;
  };
  // if a space should be highlighted fully


  // comparing and styling 1
  const diffLetters = (oldWord: string, newWord: string) => {
    const n = oldWord.length,
      m = newWord.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () =>
      Array(m + 1).fill(0)
    );

    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] =
          oldWord[i].toLowerCase() === newWord[j].toLowerCase()
            ? 1 + dp[i + 1][j + 1]
            : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    let i = 0,
      j = 0;
    const oldResult: string[] = [],
      newResult: string[] = [];

    while (i < n || j < m) {
      if (
        i < n &&
        j < m &&
        oldWord[i].toLowerCase() === newWord[j].toLowerCase()
      ) {
        if (oldWord[i] === newWord[j]) {
          oldResult.push(escapeHtml(oldWord[i]));
          newResult.push(escapeHtml(newWord[j]));
        } else {
          oldResult.push(
            `<span class="text-red-500">${escapeHtml(oldWord[i])}</span>`
          );
          newResult.push(
            `<span class="text-green-500">${escapeHtml(newWord[j])}</span>`
          );
        }
        i++;
        j++;
      } else if (j < m && (i === n || dp[i][j + 1] >= dp[i + 1][j])) {
        newResult.push(
          `<span class="text-green-500">${escapeHtml(newWord[j])}</span>`
        );
        j++;
      } else if (i < n && (j === m || dp[i][j + 1] < dp[i + 1][j])) {
        oldResult.push(
          `<span class="text-red-500">${escapeHtml(oldWord[i])}</span>`
        );
        i++;
      }
    }

    return [oldResult.join(""), newResult.join("")];
  };
  // comparing and styling 1


  // comparing and styling 2
  const lcsWordDiff = (oldWords: string[], newWords: string[]) => {
    const n = oldWords.length,
      m = newWords.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () =>
      Array(m + 1).fill(0)
    );

    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = wordsAreSimilar(oldWords[i], newWords[j])
          ? 1 + dp[i + 1][j + 1]
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    let i = 0,
      j = 0;
    const oldResult: string[] = [],
      newResult: string[] = [];

    while (i < n || j < m) {
      if (i < n && j < m && wordsAreSimilar(oldWords[i], newWords[j])) {
        if (oldWords[i] === newWords[j]) {
          oldResult.push(escapeHtml(oldWords[i]));
          newResult.push(escapeHtml(newWords[j]));
        } else {
          if (/^\s+$/.test(oldWords[i]) || /^\s+$/.test(newWords[j])) {
            const prevOld = oldWords[i - 1] || "";
            const nextOld = oldWords[i + 1] || "";
            const prevNew = newWords[j - 1] || "";
            const nextNew = newWords[j + 1] || "";

            if (/^\s+$/.test(oldWords[i]) && /\S/.test(prevOld) && /\S/.test(nextOld) && oldWords[i].length >= 2) {
              oldResult.push(renderExtraSpaces(oldWords[i], "red"));
            } else if (isHighlightableSpace(oldWords[i], i, oldWords)) {
              oldResult.push(renderSpaceBlocks(oldWords[i], "red"));
            } else {
              oldResult.push(escapeHtml(oldWords[i]));
            }

            if (/^\s+$/.test(newWords[j]) && /\S/.test(prevNew) && /\S/.test(nextNew) && newWords[j].length >= 2) {
              newResult.push(renderExtraSpaces(newWords[j], "green"));
            } else if (isHighlightableSpace(newWords[j], j, newWords)) {
              newResult.push(renderSpaceBlocks(newWords[j], "green"));
            } else {
              newResult.push(escapeHtml(newWords[j]));
            }
          } else {
            const [o, nn] = diffLetters(oldWords[i], newWords[j]);
            oldResult.push(o);
            newResult.push(nn);
          }
        }
        i++;
        j++;
      } else if (j < m && (i === n || dp[i][j + 1] >= dp[i + 1][j])) {
        if (/^\s+$/.test(newWords[j]) && /\S/.test(newWords[j - 1] || "") && /\S/.test(newWords[j + 1] || "") && newWords[j].length >= 2) {
          newResult.push(renderExtraSpaces(newWords[j], "green"));
        } else if (isHighlightableSpace(newWords[j], j, newWords)) {
          newResult.push(renderSpaceBlocks(newWords[j], "green"));
        } else {
          newResult.push(
            `<span class="text-green-500">${escapeHtml(newWords[j])}</span>`
          );
        }
        j++;
      } else if (i < n && (j === m || dp[i][j + 1] < dp[i + 1][j])) {
        if (/^\s+$/.test(oldWords[i]) && /\S/.test(oldWords[i - 1] || "") && /\S/.test(oldWords[i + 1] || "") && oldWords[i].length >= 2) {
          oldResult.push(renderExtraSpaces(oldWords[i], "red"));
        } else if (isHighlightableSpace(oldWords[i], i, oldWords)) {
          oldResult.push(renderSpaceBlocks(oldWords[i], "red"));
        } else {
          oldResult.push(
            `<span class="text-red-500">${escapeHtml(oldWords[i])}</span>`
          );
        }
        i++;
      }
    }

    return [oldResult.join(""), newResult.join("")];
  };
  // comparing and styling 2
/* LOGIC */



/* states */
const TextComparator: React.FC = () => {
  // compate state 1
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [comparedOld, setComparedOld] = useState("");
  const [comparedNew, setComparedNew] = useState("");
  const [isCompared, setIsCompared] = useState(false);
  // compate state 1


  // dropdown state
  const [open, setOpen] = useState(false);
  const [selected] = useState("ქართული");
  const options = ["ქართული", "English", "German"];
  // dropdown state


  // loading state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  // loading state

  // progress bar
  useEffect(() => {
  if (!loading) return;

  setProgress(0); // reset at start

  const totalDuration = 3000; // 3 seconds
  const intervalDelay = 50;
  const steps = totalDuration / intervalDelay;
  const increment = 100 / steps;

  const interval = setInterval(() => {
    setProgress((p) => {
      const next = p + increment;
      if (next >= 100) {
        clearInterval(interval);
        setProgress(100); // ensure exactly 100%
        setLoading(false);
        handleCompareReal();
        return 100;
      }
      return next;
    });
  }, intervalDelay);

  return () => clearInterval(interval);
  }, [loading]);
  // progress bar


  // comparing state 2
  const handleCompareReal = () => {
  const [oldHtml, newHtml] = lcsWordDiff(
    splitWords(oldText),
    splitWords(newText)
  );
  setComparedOld(oldHtml.replace(/\n/g, "<br>"));
  setComparedNew(newHtml.replace(/\n/g, "<br>"));
  setIsCompared(true);
  };

  const handleCompare = () => {
    setLoading(true);
  };

  const handleReset = () => setIsCompared(false);
  // comparing state 2
/* states */



  return (
     <main className="text-black md:flex">
      
      
      {/* mobile navbar */}
      <section className="block md:hidden w-full h-[60px] bg-[#132450]">
        <div className="container mx-auto h-full">
          <div className="flex justify-between items-center h-full px-[20px]">
            <div className="flex items-center gap-[10px]">
              <Image
                src="/logo.png"
                alt="logo"
                width={40}
                height={42}
              />
              <span className="text-white text-[13px]">ENAGRAM</span>
            </div>
            <Image
              src="/menu.png"
              alt="menu"
              width={24}
              height={24}
              className="h-[30px] w-[30px]"
            />
          </div>
        </div>
      </section>
      {/* mobile navbar */}


      {/* pc menu/nav */}
      <section className="hidden md:flex flex-col justify-between bg-[#132450] w-[240px] h-screen p-4 text-white">
        {/* Top Section */}
        <div>
          {/* Arrow top */}
          <div className="flex justify-end mb-8">
            <Image
              src="/arrow-left.png"
              alt="arrow left"
              width={20}
              height={20}
              className="h-[20px] w-[20px] hover:cursor-pointer"
            />
          </div>
          {/* Arrow top */}

          {/* Logo + ENAGRAM */}
          <div className="flex items-center gap-2 mb-10">
            <Image
              src="/logo.png"
              alt="logo"
              width={36}
              height={36}
              className="h-[36px] w-[36px] hover:cursor-pointer"
            />
            <span className="text-sm font-semibold">ENAGRAM</span>
          </div>
          {/* Logo + ENAGRAM */}

          {/* Menu items */}
          <nav className="flex flex-col gap-4">
            {/* Item 1 */}
            <div className="hover:cursor-pointer flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#1E3366] transition">
              <Image src="/check.png" alt="check" width={20} height={20} />
              <span className="text-sm">მართლმწერი</span>
            </div>
            {/* Item 1 */}

            {/* Item 2 (active) */}
            <div className="relative hover:cursor-pointer">
              <div className="flex items-center gap-3 pl-[10px] pr-6 py-2 bg-white text-[#132450] rounded-l-full  w-[calc(100%+17px)]">
                <Image src="/Spelling.png" alt="spelling" width={20} height={20} />
                <span className="text-sm font-semibold">ტექსტის შედარება</span>
              </div>
            </div>
            {/* Item 2 (active) */}

            {/* Item 3 */}
            <div className="hover:cursor-pointer flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#1E3366] transition">
              <Image src="/mic.png" alt="mic" width={20} height={20} />
              <span className="text-sm">ხმა → ტექსტი</span>
            </div>
            {/* Item 3 */}

            {/* Item 4 */}
            <div className="hover:cursor-pointer flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#1E3366] transition">
              <Image src="/sound-wave.png" alt="sound wave" width={20} height={20} />
              <span className="text-sm">ტექსტი → ხმა</span>
            </div>
            {/* Item 4 */}

            {/* Item 5 */}
            <div className="hover:cursor-pointer flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#1E3366] transition">
              <Image src="/news-paper.png" alt="news paper" width={20} height={20} />
              <span className="text-sm">PDF კონვერტაცია</span>
            </div>
            {/* Item 5 */}
          </nav>
          {/* Menu items */}
        </div>
        {/* Top Section */}

        {/* first letter name, name, 3dots */}
        <div className="flex items-center justify-between border-t border-[#1E3366] pt-4">
          <div className="hover:cursor-pointer flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#1E3366] flex items-center justify-center text-white font-semibold">
              ლ
            </div>
            <span className="text-sm">ლაშა გორაკუდაშვილი</span>
          </div>
          <Image
            src="/three-dots.png"
            alt="menu"
            width={20}
            height={20}
            className="h-[20px] w-[20px] hover:cursor-pointer mt-[4px]"
          />
        </div>
        {/* first letter name, name, 3dots */}
      </section>
      {/* pc menu/nav */}


      {/* Comparing text */}
      <section className="container mx-auto flex flex-col items-center p-6">
        {/* Top bar */}
        <div className="w-full flex flex-wrap items-center justify-between mb-6 gap-4  ">

          {/* spelling */}
          <div className="block md:hidden container">
            <div className="flex items-center">
              <Image
                src="/Spelling.png"
                alt="Spelling"
                width={24}
                height={24}
                className="h-[24px] w-[24px]"
              />
              <div className="relative inline-block">
                <div className="flex items-center justify-between px-[5px] py-[3px] border border-gray-400 rounded-md bg-white text-black w-[185px]">
                  ტექსტის შედარება
                  <svg
                    className="w-4 h-4 ml-0 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* spelling */}


          {/* dropdown + checkbox */}
          <div className="flex items-center gap-4 flex-wrap relative">
            {/* Dropdown */}
            <div className="relative w-full md:w-auto">
              <button
                onClick={() => setOpen(!open)}
                className="hover:cursor-pointer group flex items-center justify-between gap-2 px-4 py-2 border border-gray-500 rounded-md bg-white text-black flex-shrink-0 hover:border-gray-700 hover:text-gray-800 transition w-full md:w-auto"
              >
                <span className="text-left">{selected}</span>
                <svg
                  className="w-4 h-4 text-black group-hover:text-gray-800 transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown menu */}
              {open && (
                <ul className="absolute left-0 mt-1 w-full bg-white border border-gray-500 rounded-md shadow-md z-10 overflow-hidden">
                  {options.map((option, index) => (
                    <li
                      key={option}
                      className={`px-4 py-2 select-none text-center hover:cursor-pointer hover:bg-gray-100 hover:text-gray-800 transition ${
                        index === 0 ? "rounded-t-md" : ""
                      } ${index === options.length - 1 ? "rounded-b-md" : ""}`}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
              {/* Dropdown menu */}
            </div>
            {/* Dropdown */}

            {/* Checkbox with label */}
            <label className="flex items-center gap-2 text-black flex-shrink-0 hover:cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-blue-600 hover:cursor-pointer" />
              ფორმატის შენარჩუნება
            </label>
            {/* Checkbox with label */}
          </div>
          {/* dropdown + checkbox */}

          {/* Right side: button */}
          <button
            onClick={() => {
              if (!loading && (oldText || newText)) {
                setOldText("");
                setNewText("");
                setIsCompared(false);
                setComparedOld("");
                setComparedNew("");
              }
            }}
            disabled={loading || (!oldText && !newText)} // disable if loading or empty
            className={`w-full md:w-auto px-4 py-2 text-white rounded-md transition flex-shrink-0 flex items-center justify-center gap-2
              ${loading || (!oldText && !newText)
                ? "bg-[#383A4899] cursor-not-allowed"
                : "bg-[#4571E4] hover:bg-blue-700 hover:cursor-pointer"
              }`}
          >
            <Image
              src="/Plus.png"
              alt="Plus"
              width={24}
              height={24}
              className="h-[24px] w-[24px]"
            />
            ახლის გახსნა
          </button>
          {/* Right side: button */}
        </div>
        {/* Top bar */}


        {/* Textareas and overlay */}
        <div className="relative w-full flex justify-center mt-[20px]">
          {/* Textareas/comparison */}
          <div className="flex flex-col md:flex-row gap-6 w-full">
            {/* Left textarea */}
            {isCompared ? (
              <div
                className="flex-1 min-h-[190px] md:h-[432px] border rounded-md p-4 bg-white text-black overflow-y-auto whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: comparedOld }}
              />
            ) : (
              <textarea
                value={oldText}
                onChange={(e) => setOldText(e.target.value)}
                placeholder="დაიწყე წერა..."
                className="flex-1 min-h-[190px] md:h-[432px] border border-gray-500 rounded-md p-4 bg-white text-black resize-none whitespace-pre-wrap break-words focus:border-blue-600 focus:outline-none"
              />
            )}
            {/* Left textarea */}

            {/* Arrow in middle */}
            <div className="self-stretch flex items-center justify-center">
              <Image
                src="/Arrows.png"
                alt="Arrows"
                width={32}
                height={32}
                className="h-[32px] w-[32px] transform md:rotate-90"
              />
            </div>
            {/* Arrow in middle */}

            {/* Right textarea */}
            {isCompared ? (
              <div
                className="flex-1 min-h-[190px] md:h-[432px] border rounded-md p-4 bg-white text-black overflow-y-auto whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: comparedNew }}
              />
            ) : (
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="დაიწყე წერა..."
                className="flex-1 min-h-[190px] md:h-[432px] border border-gray-500 rounded-md p-4 bg-white text-black resize-none whitespace-pre-wrap break-words focus:border-blue-600 focus:outline-none"
              />
            )}
            {/* Right textarea */}
          </div>
          {/* Textareas/comparison */}

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 p-4 md:p-6">
              <div className="flex items-center gap-4 md:gap-6">
                {/* Heartbeat circles */}
                <div className="relative w-8 h-8 md:w-12 md:h-12 flex items-center justify-center">
                  {/* Outer circle */}
                  <div className="absolute w-full h-full border-2 border-blue-500 rounded-full animate-pulse-slow"></div>
                  {/* Outer circle */}

                  {/* Inner circle */}
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full animate-pulse-slow"></div>
                  {/* Inner circle */}
                </div>
                {/* Heartbeat circles */}

                {/* Text and progress */}
                <div className="flex flex-col">
                  <p className="text-gray-700 font-medium text-sm md:text-base">
                    Converting... Thank you for your patience
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-semibold text-gray-700 text-xs md:text-sm">
                      {Math.round(progress)}%
                    </span>
                    <div className="w-36 md:w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-3 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                {/* Text and progress */}
              </div>
            </div>
          )}
          {/* Loading overlay */}
        </div>
        {/* Textareas and overlay */}


        {/* Action buttons */}
        <div className="mt-6 flex gap-4">
          {!isCompared ? (
            <button
              onClick={handleCompare}
              disabled={loading || (!oldText && !newText)} // disable if loading or no text
              className={`px-6 py-2 rounded-md text-white transition 
                ${loading || (!oldText && !newText)
                  ? "bg-[#383A4899] cursor-not-allowed"
                  : "bg-[#4571E4] hover:bg-blue-700 cursor-pointer"
                }`}
            >
              შედარება
            </button>
          ) : (
            <button
              onClick={handleReset}
              disabled={loading || (!oldText && !newText)} // disable if loading or no text
              className={`flex items-center gap-2 px-6 py-2 rounded-md text-white transition
                ${loading || (!oldText && !newText)
                  ? "bg-[#383A4899] cursor-not-allowed"
                  : "bg-[#4571E4] hover:bg-blue-700 cursor-pointer"
                }`}
            >
              <Image
                src="/reload.png"
                alt="reload"
                width={20}
                height={20}
                className="h-[20px] w-[20px]"
              />
              შედარება
            </button>
          )}
        </div>
        {/* Action buttons */}
      </section>
      {/* Comparing text */}



    </main>
  );
};

export default TextComparator;