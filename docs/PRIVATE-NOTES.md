# Private Sprechtexte

Sprechtexte liegen ausschließlich lokal in `speaker-notes/`, pro Folie eine UTF-8-Datei mit der Endung `.md`. Die Dateinamen sind über `notesId` in `src/deck.ts` fest zugeordnet und bleiben bei einer Änderung der Reihenfolge erhalten. Der gesamte Ordner steht in `.gitignore` und wird weder nach `dist/` kopiert noch in JavaScript eingebaut.

Die Referentenansicht lädt nur den aktuellen Sprechtext über den lokalen Vite-Webserver, auch mit `npm run preview`. Änderungen an der Datei erscheinen innerhalb von zwei Sekunden. Im Sprechtexteditor speichert „Speichern“ direkt in die zugehörige Datei. Frühere Bearbeitungen aus dem Browserspeicher werden beim ersten Aufruf der jeweiligen Folie in die Datei übernommen. Fehlende Dateien ergeben einen leeren Sprechtext und können über den Editor angelegt werden.

Die Zuschaueransicht lädt keine Sprechtexte. Handout und synchronisierter Präsentationszustand enthalten ebenfalls keine Sprechtexte. Ein statisch veröffentlichter Build enthält nur die öffentlichen Folien. Der lokale Notiz-Endpunkt ist für den persönlichen Einsatz auf `127.0.0.1` vorgesehen und bietet keine Benutzeranmeldung für gemeinsam genutzte Server.

Ein frischer Clone enthält keine privaten Dateien. Lege bei Bedarf `speaker-notes/<notesId>.md` an oder verwende den Editor im lokalen Webserver. Bereits in früheren Commits enthaltene Texte bleiben in der Git-Historie, bis diese gesondert bereinigt wird.
