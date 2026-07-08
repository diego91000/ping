package fr.epita.assistants.ping.utils;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Optional;

@ApplicationScoped
public class Logger {
    private static final String RESET_TEXT = "\u001B[0m";
    private static final String RED_TEXT = "\u001B[31m";
    private static final String GREEN_TEXT = "\u001B[32m";

    @ConfigProperty(name = "log.file")
    Optional<String> logFile;

    @ConfigProperty(name = "error.log.file")
    Optional<String> errorLogFile;

    private static String timestamp() {
        return new SimpleDateFormat("dd/MM/yy - HH:mm:ss")
                .format(Calendar.getInstance().getTime());
    }

    public void log(String message) {
        String formatted = GREEN_TEXT + "[" + timestamp() + "] " + message + RESET_TEXT;
        if (logFile.isPresent()) {
            try (PrintWriter writer = new PrintWriter(new FileWriter(logFile.get(), true))) {
                writer.println(formatted);
                return;
            } catch (Exception e) {
            }
        }
        System.out.println(formatted);
    }

    public void error(String message) {
        String formatted = RED_TEXT + "[" + timestamp() + "] " + message + RESET_TEXT;
        if (errorLogFile.isPresent()) {
            try (PrintWriter writer = new PrintWriter(new FileWriter(errorLogFile.get(), true))) {
                writer.println(formatted);
                return;
            } catch (Exception e) {
            }
        }
        System.err.println(formatted);
    }
}
