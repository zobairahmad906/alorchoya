"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Eraser,
} from "lucide-react";

interface WordLikeEditorProps {
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
}

export default function WordLikeEditor({
  value = "",
  onChange,
  placeholder = "পণ্যের বিবরণ, কাপড়, ফিচার, সাইজ চার্ট, গ্যারান্টি ইত্যাদি বিস্তারিত লিখুন...",
}: WordLikeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    ul: false,
    ol: false,
    h1: false,
    h2: false,
    h3: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
  });

  useEffect(() => {
    if (!editorRef.current) return;
    const currentHTML = editorRef.current.innerHTML;
    const incoming = value || "";
    if (incoming !== currentHTML && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = incoming;
    }
  }, [value]);

  const updateActiveFormats = () => {
    if (typeof document === "undefined") return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        h1: document.queryCommandValue("formatBlock") === "h1",
        h2: document.queryCommandValue("formatBlock") === "h2",
        h3: document.queryCommandValue("formatBlock") === "h3",
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
      });
    } catch {
      // ignore
    }
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (html === "<p><br></p>" || html === "<br>" || html.trim() === "") {
      onChange?.("");
    } else {
      onChange?.(html);
    }
    updateActiveFormats();
  };

  const exec = (command: string, val: string | null = null) => {
    if (typeof document === "undefined" || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val || undefined);
    handleInput();
  };

  const setHeading = (tag: string) => {
    if (typeof document === "undefined" || !editorRef.current) return;
    editorRef.current.focus();
    const current = document.queryCommandValue("formatBlock");
    if (current?.toLowerCase() === tag.toLowerCase()) {
      document.execCommand("formatBlock", false, "<p>");
    } else {
      document.execCommand("formatBlock", false, `<${tag}>`);
    }
    handleInput();
  };

  const clearFormatting = () => {
    if (typeof document === "undefined" || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("removeFormat", false, undefined);
    document.execCommand("formatBlock", false, "<p>");
    handleInput();
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 8px",
    borderRadius: "6px",
    background: active ? "var(--forest)" : "transparent",
    color: active ? "#fff" : "var(--ink)",
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    transition: "all 0.15s ease",
  });

  return (
    <div
      style={{
        borderRadius: "14px",
        border: isFocused ? "1.5px solid var(--forest)" : "1px solid var(--line)",
        boxShadow: isFocused ? "0 0 0 3px rgba(23,63,53,0.12)" : "none",
        background: "#fff",
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
    >
      {/* Ribbon / Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "4px",
          padding: "8px 12px",
          background: "var(--cream)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <button type="button" title="পূর্বাবস্থা (Undo)" onClick={() => exec("undo")} style={btnStyle(false)}>
          <Undo2 size={14} />
        </button>
        <button type="button" title="পুনরায় করুন (Redo)" onClick={() => exec("redo")} style={btnStyle(false)}>
          <Redo2 size={14} />
        </button>

        <div style={{ width: "1px", height: "16px", background: "var(--line)", margin: "0 4px" }} />

        <button type="button" title="Heading 1" onClick={() => setHeading("h1")} style={btnStyle(activeFormats.h1)}>
          H1
        </button>
        <button type="button" title="Heading 2" onClick={() => setHeading("h2")} style={btnStyle(activeFormats.h2)}>
          H2
        </button>
        <button type="button" title="Heading 3" onClick={() => setHeading("h3")} style={btnStyle(activeFormats.h3)}>
          H3
        </button>

        <div style={{ width: "1px", height: "16px", background: "var(--line)", margin: "0 4px" }} />

        <button type="button" title="বোল্ড (Bold)" onClick={() => exec("bold")} style={btnStyle(activeFormats.bold)}>
          <Bold size={14} />
        </button>
        <button type="button" title="ইটালিক (Italic)" onClick={() => exec("italic")} style={btnStyle(activeFormats.italic)}>
          <Italic size={14} />
        </button>
        <button type="button" title="আন্ডারলাইন (Underline)" onClick={() => exec("underline")} style={btnStyle(activeFormats.underline)}>
          <Underline size={14} />
        </button>
        <button type="button" title="স্ট্রাইকথ্রু" onClick={() => exec("strikeThrough")} style={btnStyle(activeFormats.strikeThrough)}>
          <Strikethrough size={14} />
        </button>

        <div style={{ width: "1px", height: "16px", background: "var(--line)", margin: "0 4px" }} />

        <button type="button" title="বুলেট লিস্ট" onClick={() => exec("insertUnorderedList")} style={btnStyle(activeFormats.ul)}>
          <List size={14} />
        </button>
        <button type="button" title="নাম্বার লিস্ট" onClick={() => exec("insertOrderedList")} style={btnStyle(activeFormats.ol)}>
          <ListOrdered size={14} />
        </button>

        <div style={{ width: "1px", height: "16px", background: "var(--line)", margin: "0 4px" }} />

        <button type="button" title="বাম সারিবদ্ধ" onClick={() => exec("justifyLeft")} style={btnStyle(activeFormats.justifyLeft)}>
          <AlignLeft size={14} />
        </button>
        <button type="button" title="মাঝখানে" onClick={() => exec("justifyCenter")} style={btnStyle(activeFormats.justifyCenter)}>
          <AlignCenter size={14} />
        </button>
        <button type="button" title="ডান সারিবদ্ধ" onClick={() => exec("justifyRight")} style={btnStyle(activeFormats.justifyRight)}>
          <AlignRight size={14} />
        </button>

        <div style={{ width: "1px", height: "16px", background: "var(--line)", margin: "0 4px" }} />

        <button type="button" title="ফরমেটিং মুছুন" onClick={clearFormatting} style={btnStyle(false)}>
          <Eraser size={14} />
        </button>

        <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--coffee)", opacity: 0.7, fontWeight: 500 }}>
          রিচ টেক্সট এডিটর
        </span>
      </div>

      {/* Editor Body */}
      <div style={{ position: "relative", minHeight: "140px", background: "#fff" }}>
        {(!value || value === "<p><br></p>" || value.trim() === "") && (
          <div
            onClick={() => editorRef.current?.focus()}
            style={{
              position: "absolute",
              top: "14px",
              left: "16px",
              pointerEvents: "none",
              color: "#94a3b8",
              fontSize: "14px",
              userSelect: "none",
            }}
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            setIsFocused(true);
            updateActiveFormats();
          }}
          onBlur={() => {
            setIsFocused(false);
            handleInput();
          }}
          onInput={handleInput}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          style={{
            minHeight: "140px",
            maxHeight: "360px",
            overflowY: "auto",
            padding: "14px 16px",
            fontSize: "14px",
            lineHeight: 1.65,
            outline: "none",
            color: "var(--ink)",
          }}
        />
      </div>
    </div>
  );
}
