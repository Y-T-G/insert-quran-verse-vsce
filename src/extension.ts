import * as vscode from 'vscode';

interface Verse {
  id: number;
  jozz: number;
  sora: number;
  sora_name_en: string;
  page: number;
  line_start: number;
  line_end: number;
  aya_no: number;
  aya_text: string;
  aya_text_emlaey: string;
}

const quranVerses = <Verse[]>require('../hafsData_v18.js');

function removeDiacritics(text: string): string {
  //remove special characters
  text = text.replace(/([^\u0621-\u063A\u0641-\u064A\u0660-\u0669a-zA-Z 0-9])/g, '');

  return text;
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('insert-quran-verse.searchQuran', async () => {
    const searchText = await vscode.window.showInputBox({ prompt: 'Enter Arabic word or phrase to search' });
    if (searchText) {
      let results = quranVerses.filter((verse: { id: number; aya_text_emlaey: string; aya_text: string }) =>
        verse.aya_text_emlaey.includes(removeDiacritics(searchText))
      );

      // fallback attempt with diacritics
      if (results.length == 0) {
        results = quranVerses.filter((verse: { id: number; aya_text: string }) =>
          verse.aya_text.includes(searchText)
        );
      }

      if (results.length > 0) {
        const verseOptions = results.map((verse: { sora: number; aya_no: number; aya_text: string }) => {
          return {
            label: `${verse.sora}:${verse.aya_no}`,
            description: verse.aya_text,
          };
        });

        const selectedVerse = await vscode.window.showQuickPick(verseOptions, {
          placeHolder: 'Select a verse to insert',
        });

        if (selectedVerse) {
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor) {
            const config = vscode.workspace.getConfiguration('Y-T-G.insert-quran-verse');
            const prefix = config.get<string>('prefix') || '';
            const suffix = config.get<string>('suffix') || '';

            // Replace \n with an actual line break
            const normalizedPrefix = prefix.replace(/\\n/g, '\n');
            const normalizedSuffix = suffix.replace(/\\n/g, '\n');

            const textToInsert = `${normalizedPrefix}${selectedVerse.description}${normalizedSuffix}`;

            activeEditor.edit((editBuilder: vscode.TextEditorEdit) => {
              editBuilder.insert(activeEditor.selection.active, textToInsert);
            });
          }
        }
      } else {
        vscode.window.showInformationMessage('No matching verses found.');
      }
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }