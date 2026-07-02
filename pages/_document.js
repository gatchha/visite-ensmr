// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html>
            <Head>
                {/* Google Fonts */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Sen:wght@400;700;800&display=swap"
                    rel="stylesheet"
                />
                
                {/* Favicon ENSMR */}
                <link rel="icon" href="/favicon.png" />
                {/* ou .png si tu préfères : */}
                {/* <link rel="icon" type="image/png" href="/favicon.png" /> */}
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
