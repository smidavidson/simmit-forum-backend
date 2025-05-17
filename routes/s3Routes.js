import {Router} from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import {DeleteObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const s3Routes = Router();

// Set up a client to the S3 bucket
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

s3Routes.post("/upload_url", async (req, res) => {
    console.log(`/upload_url request made\n`);
    try {
        const {fileName, fileType} = req.body;
        
        if (!fileName || !fileType) {
            return res.status(400).json({message: "fileName and fileType required"});
        }

        if (!fileType.startsWith("image/")) {
            return res.status(400).json({ message: "Only image uploads are allowed" });
        }

        const timestamp = Date.now().toString(); // milliseconds since epoch
        const randomString = crypto.createHash('sha256').update(timestamp).digest('hex').slice(0, 12);

        // Define the resource URL that pre-signed will map to
        const key = `${req.session.user.user_id}/${randomString}-${fileName}`

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        // Expires in 15 mins
        const presignedUrl = await getSignedUrl(s3Client, command, {expiresIn: process.env.AWS_PRESIGNED_EXPIRATION_TIME});

        res.json({
            uploadUrl: presignedUrl,
            key: key,
            expiresIn: process.env.AWS_PRESIGNED_EXPIRATION_TIME
        });

    } catch (error) {
        console.log(`Retrieving pre-signed URL error: ${error.message}`);
        res.status(500).json({ message: "Error during pre-signed upload URL request" });
    }
});

export const deleteFileFromS3 = async (key) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
        })

        await s3Client.send(command);

        return true;
    } catch (error) {
        console.log(`Error deleting file: ${error.message}`)
        return false;
    }
}