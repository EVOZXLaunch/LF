import formidable from "formidable";
import fs from "fs";

export const config = {
    api: {
        bodyParser: false
    }
};

export default async function handler(
    req,
    res
) {

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });

    }

    try {

        const form =
            formidable({
                multiples: false
            });

        const [fields, files] =
            await form.parse(req);

        const file =
            files.file?.[0] ||
            files.file;

        if (!file) {

            return res.status(400).json({
                success: false,
                error: "No file uploaded"
            });

        }

        const data =
            fs.readFileSync(
                file.filepath
            );

        const pinataForm =
            new FormData();

        pinataForm.append(
            "file",
            new Blob([data]),
            file.originalFilename
        );

        const upload =
            await fetch(
                "https://api.pinata.cloud/pinning/pinFileToIPFS",
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            `Bearer ${process.env.PINATA_JWT}`
                    },
                    body: pinataForm
                }
            );

        const result =
            await upload.json();

        if (!upload.ok) {

            throw new Error(
                result.error ||
                "Pinata upload failed"
            );

        }

        return res.status(200).json({

            success: true,

            fileName:
                file.originalFilename,

            fileSize:
                file.size,

            cid:
                result.IpfsHash,

            url:
                `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

}
