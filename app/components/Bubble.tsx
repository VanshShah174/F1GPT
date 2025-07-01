import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
    </svg>
);

const useIsMobile = () => {
    const [isMobile, setIsMobile] = React.useState(false);
    React.useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 600);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
};

const Bubble = ({ message, onEdit }) => {
    const { content, role } = message;
    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(content);
    const textareaRef = useRef(null);
    const [hovered, setHovered] = useState(false);
    const isMobile = useIsMobile();

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };

    const handleEdit = () => {
        setEditing(true);
        setEditValue(content);
        setTimeout(() => {
            if (textareaRef.current) textareaRef.current.focus();
        }, 0);
    };

    const handleSave = () => {
        if (onEdit && editValue.trim() !== "") {
            onEdit(editValue);
        }
        setEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
    };

    // Responsive style for user bubble
    const userBubbleStyle: React.CSSProperties = {
        position: "relative",
        background: "#e1f4ff",
        borderRadius: "20px 20px 0 20px",
        marginLeft: "auto",
        marginRight: 0,
        textAlign: "left",
        minHeight: 36,
        padding: editing
            ? isMobile
                ? "8px 12px 44px 12px"
                : "10px 44px 10px 16px"
            : isMobile
                ? "10px 12px"
                : "14px 18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        transition: "background 0.2s, box-shadow 0.2s, padding 0.2s",
        display: "flex",
        alignItems: "center",
        maxWidth: isMobile ? "98vw" : "70%",
        width: "100%",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
        boxSizing: "border-box",
    };

    return (
        <div
            className={`${role} bubble`}
            style={role === "user" ? userBubbleStyle : { position: "relative" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {role === "assistant" ? (
                <>
                    <ReactMarkdown>{content}</ReactMarkdown>
                    <button
                        onClick={handleCopy}
                        style={{
                            position: "absolute",
                            bottom: -22,
                            right: 8,
                            background: "#f3f4f6",
                            border: "none",
                            borderRadius: 6,
                            padding: 4,
                            fontSize: 13,
                            cursor: "pointer",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        }}
                        title="Copy to clipboard"
                    >
                        {copied ? (
                            <span style={{ fontSize: 12, color: '#411b8d', fontWeight: 600 }}>Copied!</span>
                        ) : (
                            <CopyIcon />
                        )}
                    </button>
                </>
            ) : editing ? (
                <>
                    <textarea
                        ref={textareaRef}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            width: '100%',
                            minHeight: isMobile ? 36 : 28,
                            borderRadius: 16,
                            border: '1.5px solid #b3d6f7',
                            background: '#e1f4ff',
                            padding: isMobile ? '10px 10px' : '6px 12px',
                            fontSize: isMobile ? 15 : 15,
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            outline: 'none',
                            resize: 'vertical',
                            transition: 'border 0.2s',
                            maxWidth: '100%',
                        }}
                        autoFocus
                    />
                    <button
                        onClick={handleSave}
                        style={{
                            position: 'absolute',
                            right: isMobile ? 10 : 10,
                            bottom: isMobile ? 10 : 10,
                            background: '#411b8d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: isMobile ? '8px 18px' : '4px 12px',
                            fontSize: isMobile ? 15 : 14,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                            maxWidth: isMobile ? '90vw' : '40vw',
                        }}
                    >Save</button>
                </>
            ) : (
                <>
                    <span style={{ flex: 1 }}>{content}</span>
                    <button
                        onClick={handleEdit}
                        style={{
                            position: 'absolute',
                            right: 10,
                            bottom: isMobile ? -18 : -10,
                            background: 'rgba(255,255,255,0.7)',
                            border: 'none',
                            borderRadius: '50%',
                            padding: isMobile ? 8 : 5,
                            cursor: 'pointer',
                            boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
                            opacity: hovered || isMobile ? 1 : 0,
                            transition: 'opacity 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                        }}
                        tabIndex={0}
                        title="Edit message"
                    >
                        <EditIcon />
                    </button>
                </>
            )}
        </div>
    );
};

export default Bubble;