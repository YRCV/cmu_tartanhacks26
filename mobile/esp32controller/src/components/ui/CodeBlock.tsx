import React from 'react';
import { Text, TextStyle } from 'react-native';
import { theme } from '@/src/theme/colors';

interface CodeBlockProps {
    code: string;
    language?: 'cpp' | 'json';
}

export function CodeBlock({ code, language = 'cpp' }: CodeBlockProps) {
    const lines = code.split('\n');

    const renderLine = (line: string, index: number) => {
        const parts: React.ReactNode[] = [];
        let remaining = line;

        // Check for comments first
        const commentIdx = remaining.indexOf('//');
        if (commentIdx !== -1) {
            const codePart = remaining.substring(0, commentIdx);
            const commentPart = remaining.substring(commentIdx);

            if (codePart) parts.push(tokenize(codePart));
            parts.push(
                <Text key="comment" style={{ color: theme.syntax.comment }}>
                    {commentPart}
                </Text>
            );
        } else {
            parts.push(tokenize(remaining));
        }

        return (
            <Text
                key={index}
                style={{
                    color: theme.text.primary,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    lineHeight: 20
                }}
            >
                {/* Line Number */}
                <Text style={{ color: theme.text.tertiary, marginRight: 12, fontSize: 11 }}>
                    {(index + 1).toString().padStart(3, ' ')}
                </Text>
                {parts}
            </Text>
        );
    };

    const tokenize = (text: string): React.ReactNode => {
        // Split by non-word characters but keep delimiters
        const tokens = text.split(/([a-zA-Z_]\w*|\s+|"[^"]*"|[0-9]+|#\w+)/g).filter(t => t);

        return tokens.map((token, i) => {
            let style: TextStyle = { color: theme.syntax.operator };

            if (token.startsWith('"')) {
                style = { color: theme.syntax.string };
            } else if (token.startsWith('#')) {
                style = { color: theme.syntax.keyword };
            } else if (/^\d+$/.test(token)) {
                style = { color: theme.syntax.number };
            } else if (['void', 'int', 'float', 'bool', 'char', 'const', 'struct', 'class', 'auto'].includes(token)) {
                style = { color: theme.syntax.type };
            } else if (['if', 'else', 'while', 'for', 'return', 'include', 'define', 'using', 'namespace'].includes(token)) {
                style = { color: theme.syntax.keyword };
            } else if (['true', 'false', 'NULL', 'nullptr'].includes(token)) {
                style = { color: theme.syntax.number };
            } else if (/^[a-zA-Z_]\w*$/.test(token)) {
                // Function or variable names
                style = { color: theme.syntax.variable };
            }

            return <Text key={i} style={style}>{token}</Text>;
        });
    };

    return (
        <React.Fragment>
            {lines.map(renderLine)}
        </React.Fragment>
    );
}
