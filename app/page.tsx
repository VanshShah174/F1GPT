"use client"

import Image from "next/image";
import f1GPTLogo from "./assets/F1GPT.png"
import {useChat} from "@ai-sdk/react";
import {Message} from "ai";
import LoadingBubble from "./components/LoadingBubble";
import PromptSuggestionsRow from "./components/PromptSuggestionsRow";
import Bubble from "./components/Bubble";

const Home = () => {

    const {append, isLoading, messages, input, handleInputChange, handleSubmit} = useChat();

    const handlePrompt = (promptText) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: 'user'
        }
        append(msg)
    }

    const noMessages = !messages || messages.length === 0

    return (
        <main>
            <Image src={f1GPTLogo} alt="f1GPTLogo" width="250"/>
            <section className={noMessages ? " " : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            The Ultimate place for Formula One super fans!
                            Ask F1GPT Anything about the fantastic topic of F1 racing
                            and it will come back with the most up-to-date answers.
                            We hope you enjoy!!
                        </p>
                        <br/>
                        <PromptSuggestionsRow onPromptClick={handlePrompt}/>
                    </>
                ) : (
                    <>
                        {messages.map((message, index) => <Bubble key={`message-${index}`} message={message}/>)}

                        {isLoading && <LoadingBubble/>}
                    </>
                )}


            </section>
            <form onSubmit={handleSubmit}>
                <input className="question-box" onChange={handleInputChange} value={input}
                       placeholder="Ask me something... "/>
                <input type="submit"/>
            </form>

        </main>
    )
}

export default Home;