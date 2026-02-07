import re
import sys
import os


def generate_glue(ai_cpp_path, output_header_path):
    if not os.path.exists(ai_cpp_path):
        return

    with open(ai_cpp_path, "r") as f:
        content = f.read()

    # Remove comments
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
    content = re.sub(r"//.*", "", content)

    # Simplified global scope extraction
    global_scope_content = ""
    brace_level = 0
    for char in content:
        if char == "{":
            brace_level += 1
        elif char == "}":
            brace_level -= 1
        elif brace_level == 0:
            global_scope_content += char

    # Regex to find variables
    pattern = r"(?m)^(?!.*(?:static|const))\s*\b(int\b|uint16_t\b|uint32_t\b|String\b|char\s*\*|char\b)\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\s*\[\s*\d*\s*\])?)"
    matches = re.findall(pattern, global_scope_content)

    header_content = """#ifndef AI_VARS_GEN_H
#define AI_VARS_GEN_H

#include <Arduino.h>

// Externs
"""
    for var_type, var_name in matches:
        # Handle arrays vs pointers
        if "[" in var_name:
            # For extern char arr[], we need to preserve the array part
            # but usually it's easier to just match the name
            name_only = var_name.split("[")[0].strip()
            # We don't support dynamic modification of fixed-size char arrays easily via generic pointers
            # in this hackathon, but we'll declare them.
            header_content += f"extern {var_type} {var_name};\n"
        else:
            header_content += f"extern {var_type} {var_name};\n"

    header_content += """
inline bool updateVariableGeneric(String name, String value) {
"""
    for var_type, var_name in matches:
        print(f"{var_name},{var_type}")
        name_only = var_name.split("[")[0].strip()
        header_content += f'  if (name == "{name_only}") {{\n'

        if "int" in var_type or "uint" in var_type:
            header_content += f"    {name_only} = ({var_type})value.toInt();\n"
            if "LED_PIN" in name_only:
                header_content += "    pinMode(LED_PIN, OUTPUT);\n"
        elif "String" in var_type:
            header_content += f"    {name_only} = value;\n"
        elif "char" in var_type and "*" in var_type:
            header_content += f"    if ({name_only}) free((void*){name_only});\n"
            header_content += f"    {name_only} = strdup(value.c_str());\n"
        elif "char" in var_type and "[" in var_name:
            header_content += (
                f"    strncpy({name_only}, value.c_str(), sizeof({name_only})-1);\n"
            )
            header_content += f"    {name_only}[sizeof({name_only})-1] = '\\0';\n"

        header_content += "    return true;\n  }\n"

    header_content += """  return false;
}

#endif
"""

    with open(output_header_path, "w") as f:
        f.write(header_content)
    # print(f"Generated {output_header_path}")


if __name__ == "__main__":
    ai_cpp = "firmware/src/ai.cpp"
    output_h = "firmware/include/ai_vars_gen.h"
    generate_glue(ai_cpp, output_h)
