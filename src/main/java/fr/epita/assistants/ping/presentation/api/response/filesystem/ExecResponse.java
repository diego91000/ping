package fr.epita.assistants.ping.presentation.api.response.filesystem;

public class ExecResponse {
    public String stdout;
    public String stderr;
    public int exitCode;

    public ExecResponse() {
    }

    public ExecResponse(String stdout, String stderr, int exitCode) {
        this.stdout = stdout;
        this.stderr = stderr;
        this.exitCode = exitCode;
    }
}
