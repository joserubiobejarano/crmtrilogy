import {
  listAppUsers,
  listCities,
  listProgramTypes,
} from "./actions";
import { UsuariosTable } from "./UsuariosTable";
import { CitiesTable } from "./CitiesTable";
import { ProgramTypesTable } from "./ProgramTypesTable";

export default async function AdministrationPage() {
  const [appUsers, cities, programTypes] = await Promise.all([
    listAppUsers(),
    listCities(),
    listProgramTypes(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <h2 className="text-2xl font-semibold">Administración</h2>

      <section>
        <UsuariosTable rows={appUsers} />
      </section>

      <section>
        <CitiesTable rows={cities} />
      </section>

      <section>
        <ProgramTypesTable rows={programTypes} />
      </section>
    </div>
  );
}
