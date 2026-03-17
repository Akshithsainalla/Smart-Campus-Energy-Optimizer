package jar.repository;

import jar.model.EnergyUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnergyUsageRepository extends JpaRepository<EnergyUsage, Long> {
}
