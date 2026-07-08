package fr.epita.assistants.ping.utils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
class LoggerTest {
    private static final String GREEN = "\u001B[32m";
    private static final String RED  = "\u001B[31m";
    private static final String RESET  = "\u001B[0m";
    private static final String TIMESTAMP_REGEX = "\\d{2}/\\d{2}/\\d{2} - \\d{2}:\\d{2}:\\d{2}";
    @TempDir
    Path tempDir;
    private final PrintStream originalOut = System.out;
    private final PrintStream originalErr = System.err;
    private ByteArrayOutputStream outContent;
    private ByteArrayOutputStream errContent;
    @BeforeEach
    void redirectStream(){
        outContent = new ByteArrayOutputStream();
        errContent = new ByteArrayOutputStream();
        System.setOut(new PrintStream(outContent));
        System.setErr(new PrintStream(errContent));
    }
    @AfterEach
    void restoreStreams(){
        System.setOut(originalOut);
        System.setErr(originalErr);
    }
    private static Logger newLoggerWithoutFiles(){
        Logger logger = new Logger();
        TestSupport.setField(logger, "logFile", Optional.empty());
        TestSupport.setField(logger, "errorLogFile", Optional.empty());
        return logger;
    }
    @Test
    void logWithoutConfiguredFiled(){
        Logger logger = newLoggerWithoutFiles();
        logger.log("Hello world");
        assertThat(outContent.toString()).contains("Hello world");
        assertThat(errContent.toString()).isEmpty();
    }

    @Test
    void logRequirementFormat(){
        Logger logger = newLoggerWithoutFiles();
        logger.log("some message");
        String line = outContent.toString().stripTrailing();
        assertThat(line).startsWith(GREEN);
        assertThat(line).endsWith(RESET);
        String inner = line.substring(GREEN.length(), line.length() - RESET.length());
        assertThat(inner).matches("\\["+TIMESTAMP_REGEX+ "\\] some message");
    }
    @Test
    void errorConfigured(){
        Logger logger = newLoggerWithoutFiles();
        logger.error("Something flop");
        assertThat(errContent.toString()).contains("Something flop");
        assertThat(outContent.toString()).isEmpty();
    }
    @Test
    void errorRequiredFormat(){
        Logger logger = newLoggerWithoutFiles();
        logger.error("boom");
        String line = errContent.toString().stripTrailing();
        assertThat(line).startsWith(RED);
        assertThat(line).endsWith(RESET);
        String inner = line.substring(RED.length(), line.length() - RESET.length());
        assertThat(inner).matches("\\[" + TIMESTAMP_REGEX + "\\] boom");

    }
    @Test
    void logInFile() throws Exception {
        Path logFile = tempDir.resolve("app.log");
        Logger logger = new Logger();
        TestSupport.setField(logger, "logFile", Optional.of(logFile.toString()));
        TestSupport.setField(logger,"errorLogFile", Optional.empty());
        logger.log("written to file");
        assertThat(outContent.toString()).isEmpty();
        assertThat(Files.readString(logFile)).contains("written to file");
    }
    @Test
    void errorCongFileStderr() throws Exception {
        Path errorFile = tempDir.resolve("error.log");
        Logger logger = new Logger();
        TestSupport.setField(logger, "logFile", Optional.empty());
        TestSupport.setField(logger, "errorLogFile", Optional.of(errorFile.toString()));
        logger.error("written to error file");
        assertThat(errContent.toString()).isEmpty();
        assertThat(Files.readString(errorFile)).contains("written to error file");
    }
    @Test
    void logCalledTwiceWithFileAppendMessages() throws Exception {
        Path logFile = tempDir.resolve("append.log");
        Logger logger = new Logger();
        TestSupport.setField(logger, "logFile", Optional.of(logFile.toString()));
        TestSupport.setField(logger,"errorLogFile", Optional.empty());
        logger.log("first message");
        logger.log("second message");
        String content = Files.readString(logFile);
        assertThat(content).contains("first message");
        assertThat(content).contains("second message");

    }
    @Test
    void logWhenFileCannotBeWrittenFails(){
        Logger logger = new Logger();
        TestSupport.setField(logger, "logFile", Optional.of(tempDir.toString()));
        TestSupport.setField(logger, "errorLogFile" ,Optional.empty());
        logger.log("fail mess");
        assertThat(outContent.toString()).contains("fail mess");
    }
}