package jar.controller;

import jar.model.EnergyUsage;
import jar.repository.EnergyUsageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/energy")
@CrossOrigin(origins = "http://localhost:5173")
public class EnergyController {

    @Autowired
    private EnergyUsageRepository energyUsageRepository;

    @GetMapping
    public List<EnergyUsage> getAllEnergyData() {
        return energyUsageRepository.findAll();
    }

    @PostMapping
    public EnergyUsage addEnergyData(@RequestBody EnergyUsage energyUsage) {
        return energyUsageRepository.save(energyUsage);
    }
}
