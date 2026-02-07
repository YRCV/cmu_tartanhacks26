import re
import sys
import os


def extract_global_variables(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, "r") as f:
        content = f.read()

    # Remove multi-line comments
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
    # Remove single-line comments
    content = re.sub(r"//.*", "", content)

    # Simplified approach to find global variables:
    # 1. Split by functions/scopes to identify global scope.
    # Actually, a better way is to find top-level declarations that are not functions.

    # Regex for potential variable declarations at the start of a line or after a semicolon/newline
    # We want to match: [type] [name] [optional initialization];
    # But specifically avoid those inside braces.

    # Let's remove everything inside curly braces to keep only global scope
    # This is a naive stack-based approach for nested braces
    global_scope_content = ""
    brace_level = 0
    for char in content:
        if char == "{":
            brace_level += 1
        elif char == "}":
            brace_level -= 1
        elif brace_level == 0:
            global_scope_content += char

    # Now look for variables in global_scope_content
    # Types: int, char*, String
    # Avoid: static, const

    # Pattern explanation:
    # (?!.*(static|const)) -> Negative lookahead to ensure line doesn't contain static or const
    # \b(int\b|String\b|char\s*\*|char\b) -> Match type (int, String, char*, or char)
    # \s*([a-zA-Z_][a-zA-Z0-9_]*(?:\s*\[\s*\d*\s*\])?) -> Match name, including potential array brackets like [] or [32]

    pattern = r"(?m)^(?!.*(?:static|const))\s*\b(int\b|String\b|char\s*\*|char\b)\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\s*\[\s*\d*\s*\])?)"

    matches = re.findall(pattern, global_scope_content)

    if not matches:
        print("No matches found in global scope (excluding static/const).")
    else:
        print(f"{'Type':<15} | {'Variable Name':<25}")
        print("-" * 45)
        for var_type, var_name in matches:
            # Clean up formatting for output
            clean_type = re.sub(r"\s+", " ", var_type).strip()
            print(f"{clean_type:<15} | {var_name:<25}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
    else:
        # Default to ai.cpp if no arg provided
        target_file = "firmware/src/ai.cpp"

    extract_global_variables(target_file)
