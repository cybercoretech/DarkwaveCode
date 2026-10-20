import sqlite3
import sys


def main(path):
    connection = sqlite3.connect(":memory:")
    source = open(path, encoding="utf-8").read()
    pending = ""
    for line in source.splitlines():
        pending += line + "\n"
        if not sqlite3.complete_statement(pending):
            continue
        statement, pending = pending.strip(), ""
        if not statement:
            continue
        cursor = connection.execute(statement)
        if cursor.description:
            print(" | ".join(column[0] for column in cursor.description))
            for row in cursor.fetchall():
                print(" | ".join("NULL" if value is None else str(value) for value in row))
    if pending.strip():
        raise sqlite3.OperationalError("incomplete SQL statement")
    connection.close()


if __name__ == "__main__":
    try:
        main(sys.argv[1])
    except (sqlite3.Error, OSError) as error:
        print(f"SQL error: {error}", file=sys.stderr)
        sys.exit(1)
