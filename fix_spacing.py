import re

with open('src/creator/components/tabs/SettingsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Instead of blindly replacing all, I'll use multi_replace. No wait, a targeted python script.
replacements = [
    (r'className="(.*?)gap-4(.*?)"', r'className="\1\2" style={{ gap: "16px" }}'),
    (r'className="(.*?)gap-3(.*?)"', r'className="\1\2" style={{ gap: "12px" }}'),
    (r'className="(.*?)gap-2(.*?)"', r'className="\1\2" style={{ gap: "8px" }}'),
    (r'className="(.*?)p-2\.5(.*?)"', r'className="\1\2" style={{ padding: "10px" }}'),
    (r'className="(.*?)p-6(.*?)"', r'className="\1\2" style={{ padding: "24px" }}'),
    (r'className="(.*?)p-8(.*?)"', r'className="\1\2" style={{ padding: "32px" }}'),
    (r'className="(.*?)px-8 pb-8 pt-2(.*?)"', r'className="\1\2" style={{ padding: "8px 32px 32px" }}'),
    (r'className="(.*?)mb-4 pb-4(.*?)"', r'className="\1\2" style={{ marginBottom: "16px", paddingBottom: "16px" }}'),
    (r'className="(.*?)mb-6 pb-4(.*?)"', r'className="\1\2" style={{ marginBottom: "24px", paddingBottom: "16px" }}'),
    (r'className="(.*?)mt-6(.*?)"', r'className="\1\2" style={{ marginTop: "24px" }}'),
]

for pattern, repl in replacements:
    text = re.sub(pattern, repl, text)

# fix double spaces in className
text = re.sub(r'className="(.*?)\s\s+(.*?)"', r'className="\1 \2"', text)
text = re.sub(r'className=" (.*?)"', r'className="\1"', text) # leading space

with open('src/creator/components/tabs/SettingsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
