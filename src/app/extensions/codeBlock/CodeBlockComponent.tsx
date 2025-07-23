import React, { useCallback } from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Select } from "antd";

const { Option } = Select;

interface CodeBlockComponentProps {
  node: any;
  updateAttributes: (attrs: any) => void;
  editor: any;
}

const languages = [
  { value: "plaintext", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "scala", label: "Scala" },
  { value: "r", label: "R" },
  { value: "matlab", label: "MATLAB" },
  { value: "sql", label: "SQL" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "bash", label: "Bash" },
  { value: "shell", label: "Shell" },
  { value: "powershell", label: "PowerShell" },
];

export const CodeBlockComponent: React.FC<CodeBlockComponentProps> = ({
  node,
  updateAttributes,
}) => {
  const handleLanguageChange = useCallback(
    (value: string) => {
      updateAttributes({ language: value });
    },
    [updateAttributes],
  );

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div className="code-block-header">
        <Select
          showSearch
          placeholder="言語を選択"
          optionFilterProp="label"
          filterOption={(input, option) =>
            (option?.label as string)
              ?.toLowerCase()
              .includes(input.toLowerCase()) ?? false
          }
          value={node.attrs.language || "plaintext"}
          onChange={handleLanguageChange}
          className="language-selector"
        >
          {languages.map((lang) => (
            <Option key={lang.value} value={lang.value} label={lang.label}>
              {lang.label}
            </Option>
          ))}
        </Select>
      </div>
      <pre className="code-block-content">
        <NodeViewContent
          props={{
            as: "code",
            className: `language-${node.attrs.language || "plaintext"}`,
          }}
        />
      </pre>
    </NodeViewWrapper>
  );
};
