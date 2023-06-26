
module.exports = ({htmlWebpackPlugin}) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>defectivereflections</title>
</head>
<body>
    ${htmlWebpackPlugin.tags.bodyTags}
</body>
</html>
`;
}