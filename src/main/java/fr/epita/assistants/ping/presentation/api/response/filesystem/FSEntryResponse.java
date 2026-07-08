package fr.epita.assistants.ping.presentation.api.response.filesystem;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
public class FSEntryResponse {
    public String name;
    public String path;
    public Boolean isDirectory;
}
