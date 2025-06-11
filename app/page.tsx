"use client"

import Image from "next/image";
import f1GPTLogo from "./assets/F1GPT.png"
import {useChat} from "@ai-sdk/react";
import {Message} from "ai";

const Home = () => {

    const {append, status , messages, input, handleInputChange, handleSubmit} = useChat();


    const noMessages = true

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
                        {/*<PromptSuggestionRow />*/}
                    </>
                ) : (
                    <>
                        {/*map messages onto text bubbles*/}
                        {/*<LoadingBubble />*/}
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