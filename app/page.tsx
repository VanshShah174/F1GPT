"use client"

import Image from "next/image";
import f1GPTLogo from "./assets/F1GPT.png";
import { useChat } from "@ai-sdk/react";
import { Message } from "ai";
import LoadingBubble from "./components/LoadingBubble";
import PromptSuggestionsRow from "./components/PromptSuggestionsRow";
import Bubble from "./components/Bubble";

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit } =
        useChat({ api: "/api/chat" });

    const handlePrompt = (promptText: string) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user",
        };
        append(msg);
    };

    const noMessages = !messages || messages.length === 0;

    return (
        <main>
            <div className="logo-container">
                <Image src={f1GPTLogo} alt="F1GPT logo" width={200} height={60} />
            </div>

            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            The ultimate place for Formula One superfans! Ask me anything
                            about F1 racing and get the most up-to-date answers.
                        </p>
                        <PromptSuggestionsRow onPromptClick={handlePrompt} />
                    </>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <Bubble key={message.id ?? index} message={message} />
                        ))}
                        {isLoading && <LoadingBubble />}
                    </>
                )}
            </section>

            <form onSubmit={handleSubmit}>
                <input
                    className="question-box"
                    onChange={handleInputChange}
                    value={input}
                    placeholder="Ask me something..."
                />
                <input type="submit" value="Send" />
            </form>
        </main>
    );
};

export default Home;
