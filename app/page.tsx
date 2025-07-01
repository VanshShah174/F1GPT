"use client"

import Image from "next/image";
import f1GPTLogo from "./assets/F1GPT.png";
import { useChat } from "@ai-sdk/react";
import { Message } from "ai";
import LoadingBubble from "./components/LoadingBubble";
import PromptSuggestionsRow from "./components/PromptSuggestionsRow";
import Bubble from "./components/Bubble";
import { useRef, useEffect } from "react";

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit, setMessages } =
        useChat({ api: "/api/chat" });

    const handlePrompt = (promptText: string) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user",
        };
        append(msg);
    };

    // Edit handler for user messages
    const handleEditUserMessage = (editIndex, newContent) => {
        if (!messages || messages.length === 0) return;
        // Remove the user message and the next assistant message (if any)
        const updatedMessages = messages.filter((_, idx) => idx !== editIndex && idx !== editIndex + 1);
        setMessages(updatedMessages);
        // Re-send the updated prompt (append will add the user message and trigger assistant response)
        append({
            id: crypto.randomUUID(),
            content: newContent,
            role: "user",
        });
    };

    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);

    const noMessages = !messages || messages.length === 0;

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <main>
            <div className="logo-container">
                <Image src={f1GPTLogo} alt="F1GPT logo" width={200} height={100} />
            </div>

            <section
                className={noMessages ? "" : "populated"}
                ref={messagesContainerRef}
            >
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            <b style={{ margin: 10 }}>
                                The ultimate place for Formula One superfans! Ask me anything
                                about F1 racing and get the most up-to-date answers.
                            </b>
                        </p>
                        <PromptSuggestionsRow onPromptClick={handlePrompt} />
                    </>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <Bubble
                                key={message.id ?? index}
                                message={message}
                                onEdit={
                                    message.role === "user"
                                        ? (newContent) => handleEditUserMessage(index, newContent)
                                        : undefined
                                }
                            />
                        ))}
                        {isLoading && <LoadingBubble />}
                        {/* This div ensures we always scroll to the latest message */}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </section>

            <form onSubmit={handleSubmit}>
                <textarea
                    className="question-box"
                    onChange={handleInputChange}
                    value={input}
                    placeholder="Ask me something..."
                    rows={2}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                        // Shift+Enter will add a new line (default behavior)
                    }}
                />
                <input type="submit" value="Send" disabled={input.trim() === ""} />
            </form>
        </main>
    );
};

export default Home;
