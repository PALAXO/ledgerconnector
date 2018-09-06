import javafx.geometry.HPos;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;

public class CreateTab extends Tab {

    private GridPane gP = new GridPane();

    private TextField privateKeyTxt = new TextField();
    private TextField documentTxt = new TextField();
    private TextField timeLimitTxt = new TextField();
    private TextField maxFeeTxt = new TextField();
    private TextField shareTxt = new TextField();

    private TextArea infoTxt = new TextArea();

    /**
     * Assembles form for saving data into blockchain
     */
    public CreateTab() {
        this.setText("Create");
        this.setContent(gP);

        gP.setHgap(5);
        gP.setVgap(10);
        gP.alignmentProperty().set(Pos.TOP_CENTER);
        gP.setPadding(new Insets(10));

        ColumnConstraints col1 = new ColumnConstraints();
        col1.setPercentWidth(20);
        col1.setHalignment(HPos.RIGHT);

        ColumnConstraints col2 = new ColumnConstraints();
        col2.setPercentWidth(60);
        col2.setHalignment(HPos.LEFT);

        gP.getColumnConstraints().addAll(col1, col2);

        int freeRowId = createStaticMenu();
        freeRowId = createRecordOptions(freeRowId);


        createBottom(freeRowId);
    }

    /**
     * Creates form with:
     *  - Wallet private key - Private key of the wallet which will save data into the blockchain
     *  - Document - No. of the document
     *  - Saving time limit - The longest period of time for saving data into the blockchain
     *  - Max fee - Maximum fee for saving data into the blockchain
     *
     * @return Id of the first content free row
     */
    private int createStaticMenu() {
        gP.addColumn(0,
                new Label("Wallet private key"),
                new Label("Document"),
                new Label("Saving time limit"),
                new Label("Max fee"));

        gP.addColumn(1, privateKeyTxt, documentTxt, timeLimitTxt, maxFeeTxt);

//        System.out.println("Return 4; gP size = " + gP.getRowConstraints().size());

        return 4;
    }

    /**
     * Creates form for selecting a type of information to save (Information, signature)
     * After selecting a type generates appropriate form
     *
     * @param rowId Id of the first content free row
     * @return New id of the first content free row
     */
    private int createRecordOptions(int rowId) {
        gP.add(new Label("Action"), 0, rowId);

        ToggleGroup actionOptions = new ToggleGroup();
        RadioButton signRB = new RadioButton("Sign document");
        RadioButton claimRB = new RadioButton("Claim author's work");
        RadioButton shareRB = new RadioButton("Share document");

        signRB.setToggleGroup(actionOptions);
        claimRB.setToggleGroup(actionOptions);
        shareRB.setToggleGroup(actionOptions);

        signRB.setSelected(true);

        gP.add(signRB, 1, rowId++);
        gP.add(claimRB, 1, rowId++);
        gP.add(shareRB, 1, rowId++);

        Label shareLbl = new Label("Share document with");
        //shareLbl.setTooltip(new Tooltip("Enter public wallet address of the person with whom the document will be shared."));
        shareLbl.setVisible(false);
        shareTxt.setVisible(false);

        gP.add(shareLbl, 0, rowId);
        gP.add(shareTxt, 1, rowId++);


        signRB.setOnAction(event -> {
            shareLbl.setVisible(shareRB.isSelected());
            shareTxt.setVisible(shareRB.isSelected());
        });
        claimRB.setOnAction(event -> {
            shareLbl.setVisible(shareRB.isSelected());
            shareTxt.setVisible(shareRB.isSelected());
        });
        shareRB.setOnAction(event -> {
            shareLbl.setVisible(shareRB.isSelected());
            shareTxt.setVisible(shareRB.isSelected());
        });

//        ObservableList<String> purposeOptions =
//                FXCollections.observableArrayList(
//                        "Sign document",
//                        "Share document",
//                        "Claim author's work"
//                );
//

//        gP.add(infoTxt, 1, rowId + 1);

        return rowId;
    }

    /**
     * Creates button for saving data
     *
     * @param rowId Id of the first content free row
     */
    private void createBottom(int rowId) {
        Button confirmBtn = new Button("Send");
        confirmBtn.setTooltip(new Tooltip("Sends data to the selected blockchain network."));
        confirmBtn.setOnAction(event -> {
            // TODO Prepare data and send it to blockchain
        });

        HBox hBox = new HBox(confirmBtn);
        hBox.setAlignment(Pos.CENTER_RIGHT);

        gP.add(hBox, 1, rowId);
    }
}
