import fs from "fs"
import {each, go, head, hi, log, map, reject, replace, sortBy, sortByDesc, sortDesc, split, tap} from "fxjs";
import POOL from "./db_connect_fx.js";

const migration_folder = "./migration"
const exist = await POOL.QUERY`select count(*) from pg_class where relname = 'migrations';`

fs.readdir(migration_folder, function (error, filelist) {
    go(
        filelist,
        map(split("_")),
        map(([number, file]) => [Number(number), file]),
        sortByDesc(([number, file]) => number),
        head,
        async ([file_number, file_name]) => {
            const Migration = await import(`${migration_folder}/${file_number}_${file_name}`)

            go(
                exist,
                reject(data => data.count == "1"),
                each(_ => POOL.QUERY`
                    create table migrations
                    (
                        id              serial primary key,
                        file_name       text ,
                        migration_time  timestamp with time zone,
                        unique (file_name)
                    )
                `)
            )

            await Migration.default.init()

            await POOL.QUERY`insert into migrations ${POOL.VALUES({file_name:`${file_number}_${file_name}`})};`

            await POOL.END(); // Promise
        }
    );
})

